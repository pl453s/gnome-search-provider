const { Gio, St } = imports.gi;
const { main }    = imports.ui;
const { util }    = imports.misc;

const dir_enabled = true;
const dir_appname = "Places";
const dir_appicon = "system-file-manager";
const dir_bkmarks = true;
const dir_mounted = true;
const dir_address = true;

const web_enabled = true;
const web_appname = "Internet";
const web_appicon = "applications-internet";
const web_bkmarks = true;
const web_engines = true;
const web_address = true;

let dir_bookmarks = [];
dir_bookmarks.push(JSON.stringify({ name: "Home", icon: "user-home-symbolic", url: "/home/user" }));
dir_bookmarks.push(JSON.stringify({ name: "Documents", icon: "folder-documents-symbolic", url: "/home/user/Documents" }));
dir_bookmarks.push(JSON.stringify({ name: "Pictures", icon: "folder-pictures-symbolic", url: "/home/user/Pictures" }));
dir_bookmarks.push(JSON.stringify({ name: "Music", icon: "folder-music-symbolic", url: "/home/user/Music" }));
dir_bookmarks.push(JSON.stringify({ name: "Videos", icon: "folder-videos-symbolic", url: "/home/user/Videos" }));
dir_bookmarks.push(JSON.stringify({ name: "Trash", icon: "user-trash-symbolic", url: "trash:///" }));
dir_bookmarks.push(JSON.stringify({ name: "Computer", icon: "drive-harddisk-symbolic", url: "/" }));
const dir_mntsymb = true;
const dir_urlsymb = true;

let web_bookmarks = [];
web_bookmarks.push(JSON.stringify({ name: "Wikipedia", icon: "globe-symbolic", url: "https://www.wikipedia.org" }));
web_bookmarks.push(JSON.stringify({ name: "YouTube", icon: "media-playback-start-symbolic", url: "https://www.youtube.com" }));
web_bookmarks.push(JSON.stringify({ name: "Google Maps", icon: "mark-location-symbolic", url: "https://maps.google.com" }));
web_bookmarks.push(JSON.stringify({ name: "Google Translate", icon: "preferences-desktop-locale-symbolic", url: "https://translate.google.com" }));
let web_srengines = [];
web_srengines.push(JSON.stringify({ name: "Search with DuckDuckGo", icon: "search-symbolic", url: "https://duckduckgo.com/?q=" }));
web_srengines.push(JSON.stringify({ name: "Search with Qwant", icon: "search-symbolic", url: "https://www.qwant.com/?q=" }));
web_srengines.push(JSON.stringify({ name: "Search with Google", icon: "search-symbolic", url: "https://www.google.com/search?q=" }));
const web_urlicon = "url-copy";

function isPath(str) {
    return (str[0] == "/");
}
function isLink(str) {
    return (str.indexOf(".") > -1 && str.indexOf(" ") == -1);
}
function getResultMeta(id) {
    const { name, icon, info, url } = JSON.parse(id);
    return {
        'id'          : id,
        'name'        : name,
        'description' : info,
        'createIcon'  : function(size) { return new St.Icon({ gicon: Gio.icon_new_for_string(icon), icon_size: size }); }
    };
}
function getOverviewSearchResult() {
    if (main.overview.viewSelector !== undefined) {
        return main.overview.viewSelector._searchResults;
    }
    else {
        return main.overview._overview.controls._searchController._searchResults;
    }
}

const dirProvider = {
    appInfo: {
        get_name   : () => dir_appname,
        get_icon   : () => Gio.icon_new_for_string(dir_appicon),
        get_id     : () => "dir-search-provider",
        should_show: () => true,
    },
    getResultMetas(results, cb) {
        cb(results.map(getResultMeta));
    },
    activateResult(result) {
        const { name, icon, info, url } = JSON.parse(result);
        util.spawn(["xdg-open", url]);
    },
    filterResults(providerResults, maxResults) {
        if (expand && expandmax > maxResults) {
        	maxResults = expandmax;
        	expand = false;
        }
        return providerResults.slice(0, maxResults);
    },
    getInitialResultSet(terms, cb) {
        results = [];
        search = terms.join(" ");
        if (dir_enabled) {
            if (isPath(search)) {
                if (dir_address) {
                    index = search.lastIndexOf("/")+1;
                    path = search.slice(0,index);
                    after = search.slice(index);
                    file = Gio.File.new_for_path(path);
                    if (file.query_file_type(Gio.FileQueryInfoFlags.NONE, null) == Gio.FileType.DIRECTORY) {
                        list = file.enumerate_children("*", Gio.FileQueryInfoFlags.NONE, null);
                        while (info = list.next_file(null)) {
                            name = info.get_name();
                            if (dir_urlsymb) {
                                icon = info.get_symbolic_icon();
                            }
                            else {
                                icon = info.get_icon();
                            }
                            if (name.slice(0, after.length) == after) {
                                results.push(JSON.stringify({ name: path+name, icon: icon.to_string(), info: "", url: path+name }));
                            }
                        }
                    }
                    expand = true;
                }
            }
            else {
                if (dir_bkmarks) {
                    for (dir_bookmark in dir_bookmarks) {
                        const { name, icon, url } = JSON.parse(dir_bookmarks[dir_bookmark]);
                        if (name.toUpperCase().indexOf(search.toUpperCase()) > -1) {
                            results.push(JSON.stringify({ name: name, icon: icon, info: url, url: url }));
                        }
                    }
                }
                if (dir_mounted) {
                    mounts = Gio.VolumeMonitor.get().get_mounts();
                    mounts.sort();
                    for (mount in mounts) {
                        root = mounts[mount].get_root();
                        name = mounts[mount].get_name();
                        if (dir_mntsymb) {
                            icon = mounts[mount].get_symbolic_icon();
                        }
                        else {
                            icon = mounts[mount].get_icon();
                        }
                        if (name.toUpperCase().indexOf(search.toUpperCase()) > -1) {
                            results.push(JSON.stringify({ name: name, icon: icon.to_string(), info: root.get_path(), url: root.get_path() }));
                            global.log(icon.to_string());
                        }
                    }
                }
            }
        }
        cb(results);
    },
    getSubsearchResultSet(_, terms, cb) {
        this.getInitialResultSet(terms, cb);
    }
};

const webProvider = {
    appInfo: {
        get_name   : () => web_appname,
        get_icon   : () => Gio.icon_new_for_string(web_appicon),
        get_id     : () => "web-search-provider",
        should_show: () => true,
    },
    getResultMetas(results, cb) {
        cb(results.map(getResultMeta));
    },
    activateResult(result) {
        const { name, icon, info, url } = JSON.parse(result);
        util.spawn(["xdg-open", url]);
    },
    filterResults(providerResults, maxResults) {
        if (expand && expandmax > maxResults) {
        	maxResults = expandmax;
        	expand = false;
        }
        return providerResults.slice(0, maxResults);
    },
    getInitialResultSet(terms, cb) {
        results = [];
        search = terms.join(" ");
        if (web_enabled && !isPath(search)) {
            if (isLink(search)) {
                if (web_address) {
                    results.push(JSON.stringify({ name: search, icon: web_urlicon, info: "", url: search }));
                }
            }
            else {
                if (web_bkmarks) {
                    for (web_bookmark in web_bookmarks) {
                        const { name, icon, url } = JSON.parse(web_bookmarks[web_bookmark]);
                        if (name.toUpperCase().indexOf(search.toUpperCase()) > -1) {
                            results.push(JSON.stringify({ name: name, icon: icon, info: url, url: url }));
                        }
                    }
                }
                if (web_engines) {
                    for (web_srengine in web_srengines) {
                        const { name, icon, url } = JSON.parse(web_srengines[web_srengine]);
                        results.push(JSON.stringify({ name: name, icon: icon, info: url+search, url: url+search }));
                    }
                }
            }
        }
        cb(results);
    },
    getSubsearchResultSet(_, terms, cb) {
        this.getInitialResultSet(terms, cb);
    }
};

function init() {}
let dir_instance;
let web_instance;
let expand = false;
const expandmax = 20;
function enable() {
    dir_provider = Object.create(dirProvider);
    web_provider = Object.create(webProvider);
    getOverviewSearchResult()._registerProvider(dir_provider);
    getOverviewSearchResult()._registerProvider(web_provider);
}
function disable() {
    getOverviewSearchResult()._unregisterProvider(dir_provider);
    getOverviewSearchResult()._unregisterProvider(web_provider);
}