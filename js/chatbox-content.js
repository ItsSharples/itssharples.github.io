let client_id = "kf48fc5oafct9wqb1jf3lrsfurujq2";
var client;
if (location.hash) {
    connectToTwitch(location.hash.substring(1))
    setInterval(() => { window.scrollBy({ 'top': window.innerHeight, 'behavior': 'instant' }); }, 1000);
}
else {
    if (document.getElementById("config")) {
        try {
            connectToTwitch("eyJ0b2tlbiI6IjJ2dm10b2E1eDlqbmZkN3hhMmI1dmszZGdvcnRtYSIsImNoYW5uZWwiOiJzaGFycGxlcyIsImVtb3RlcyI6Im9uIiwiZW5hYmxlZCI6eyJvbmx5Ijp0cnVlLCJ0d2l0Y2giOiJvbiIsImJ0dHYiOiJvbiJ9LCJmb250Ijp7ImZhbWlseSI6InN5c3RlbS11aSIsImZvbnQiOiI1MCJ9fQ")
        }
        catch (err) {
            console.log(err);
        }
    }
    else {
        sendToConfigurator();
    }
}

function connectToTwitch(hash) {
    // work out what the hash means
    const config = Base64ToConfig(hash);

    config.customEmotes = (!!config.emotesBTTV) || (!!config.emotes7TV) || (!!config.emotesFFZ);

    console.log(config);

    document.getElementById("chatbox").style.setProperty("--font-family", config.fontFamily);

    document.getElementById("chatbox").style.setProperty("--font-height", config.fontSize + "px");
    document.getElementById("chatbox").style.setProperty("--font-height-half", (config.fontSize / 2) + "px");

    client = new tmi.Client({
        options: { skipUpdatingEmotesets: true },
        identity: {
            username: client_id,
            password: 'oauth:' + config.accessToken
        },
        channels: [config.channelName]
    });

    client.connect();

    (async () => {
        var channel_id = await getChannelID(config)

        var badges = [];
        badges = badges.concat(await getGlobalBadges(config, channel_id));
        badges = badges.concat(await getChannelBadges(config, channel_id));

        var emotes = [];
        var customEmotes = [];

        console.log(await get7TVChannelEmotes(config, "50030128"));
        //console.log(await getFFZChannelEmotes(config, "50030128"));

        if (!!config.enableEmotes) {
            if (!!config.emotesTwitch) {
                emotes = emotes.concat(await getGlobalEmotes(config, channel_id));
                emotes = emotes.concat(await getChannelEmotes(config, channel_id));
            }
            if (!!config.customEmotes) {
                if (!!config.emotesBTTV) {
                    customEmotes = customEmotes.concat(await getBTTVChannelEmotes(config, channel_id));
                }

                if (!!config.emotes7TV) {
                    customEmotes = customEmotes.concat(await get7TVChannelEmotes(config, "50030128"));
                }
                customEmotes = customEmotes.concat(await getFFZChannelEmotes(config, "50030128"));
                if (!!config.emotesFFZ) {
                    customEmotes = customEmotes.concat(await getFFZChannelEmotes(config, "50030128"));
                }
            }
            console.log(customEmotes);
        }


        listenToMessage(config, channel_id, badges, emotes, customEmotes);
    })()
}

function sendToConfigurator() {
    window.location.href = "/chatbox";
}
function JSONtoBase64(json) { return btoa(JSON.stringify(json)); }
function Base64ToJSON(b64Data) { return JSON.parse(atob(b64Data)); }
function ConfigToBase64(config) {
    output = {}
    output.token = config.accessToken;
    output.channel = config.channelName;

    output.emotes = config.enableEmotes;
    output.enabled = {
        'only': config.emoteOnly,
        'twitch': config.emotesTwitch,
        'bttv': config.emotesBTTV,
        'ffz': config.emotesFFZ,
        '7TV': config.emotes7TV
    }
    output.font = {
        'family': config.fontFamily,
        'font': config.fontSize,
        'badge': config.badgeSize,
        'emote': config.emoteSize
    }
    return JSONtoBase64(output);
}
function Base64ToConfig(b64) {
    input = Base64ToJSON(b64);
    config = {};
    config.accessToken = input.token;
    config.channelName = input.channel;

    config.enableEmotes = input.emotes;
    config.emoteOnly = input.enabled.only;
    config.emotesTwitch = input.enabled.twitch;
    config.emotesBTTV = input.enabled.bttv;
    config.emotesFFZ = input.enabled.ffz;
    config.emotes7TV = input.enabled.stv;

    config.fontFamily = input.font.family;
    config.fontSize = input.font.font;
    config.badgeSize = input.font.badge;
    config.emoteSize = input.font.emote;

    return config;
}

async function getChannelID(config) {
    return fetch(`https://api.twitch.tv/helix/users?login=${config.channelName}`, {
        headers: {
            "Authorization": `Bearer ${config.accessToken}`,
            "Client-Id": client_id
        }
    })
        .then(response => response.json())
        .then(data => data.data[0].id);
}

async function getGlobalBadges(config, id) {
    return fetch("https://api.twitch.tv/helix/chat/badges/global", {
        headers: {
            "Authorization": `Bearer ${config.accessToken}`,
            "Client-Id": client_id
        }
    })
        .then(response => response.json())
        .then(data => data.data);
}

async function getChannelBadges(config, id) {
    return fetch(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${id}`, {
        headers: {
            "Authorization": `Bearer ${config.accessToken}`,
            "Client-Id": client_id
        }
    })
        .then(response => response.json())
        .then(data => data.data);
}

async function getGlobalEmotes(config, id) {
    return fetch(`https://api.twitch.tv/helix/chat/emotes/global`, {
        headers: {
            "Authorization": `Bearer ${config.accessToken}`,
            "Client-Id": client_id
        }
    })
        .then(response => response.json())
        .then(data => data.data);
}

async function getChannelEmotes(config, id) {
    return fetch(`https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${id}`, {
        headers: {
            "Authorization": `Bearer ${config.accessToken}`,
            "Client-Id": client_id
        }
    })
        .then(response => response.json())
        .then(data => data.data);
}

async function getBTTVChannelEmotes(config, id) {
    return fetch(`https://api.betterttv.net/3/cached/users/twitch/${id}`)
        .then(response => response.json())
        .then(data => data.channelEmotes.concat(data.sharedEmotes))
        .then(emotes => {
            let output = [];
            for (index in emotes) {
                let emote = emotes[index];
                let newEmote = {};
                newEmote["name"] = emote["code"];
                newEmote["url"] = `https://cdn.betterttv.net/emote/${emote.id}/3x`;
                let imgSet = [];
                for (scale of ["1x", "2x", "3x"]) {
                    imgSet.push(`https://cdn.betterttv.net/emote/${emote.id}/${scale} ${scale}`);
                }
                newEmote["imgSet"] = imgSet;
                output.push(newEmote);
            }
            return output;
        })
}

async function get7TVChannelEmotes(config, id) {
    return fetch(`https://api.7tv.app/v2/users/${id}/emotes`)
        .then(response => response.json())
        .then(data => data)
}

async function getFFZChannelEmotes(config, id) {
    return fetch(`https://api.frankerfacez.com/v1/room/id/${id}`)
        .then(response => response.json())
        .then(data => data.sets)
        .then(sets => Object.values(sets)
            .map(set => set.emoticons
                .map(emote => {
                    console.log(emote);
                    let value = {};
                    value.name = emote.name;
                    let urls = Object.entries(emote.urls).map(
                        ([scale, url], i) => `https:${url} ${scale}x`
                    )
                    value.imgSet = urls;
                    return value
                })
            ))

}

function listenToMessage(config, id, badgesData, twitchEmotes, customEmotes) {
    function setIdEquals(name) { return (object, index, array) => object.set_id == name; }
    function getBadgesFor(name) {
        return (badgesData.find(setIdEquals(name)) ?? []);
    }
    function IdEquals(name) { return (object, index, array) => object.id == name; }
    function getEmotes() {

        // get7TVGlobalEmotes
        // https://api.7tv.app/v2/emotes/global
        // get7TVChannelEmotes
        // https://api.7tv.app/v2/users/${id}/emotes

        // getBTTVGlobalEmotes
        // getBTTVChannelEmotes
        // https://api.betterttv.net/3/cached/users/twitch/${id}

        // https://cdn.betterttv.net/emote/556b5df02558416e1b5f0082/3x

        // getFFZGlobalEmotes
        // 
        // getFFZChannelEmotes
        // https://api.frankerfacez.com/v1/room/id/${id}
        // https://api.betterttv.net/3/cached/frankerfacez/users/twitch/${id}


        return twitchEmotes;
    }

    const subscriberBadges = getBadgesFor("subscriber");
    const bitsBadges = getBadgesFor("bits");
    const emoteCache = getEmotes();

    function naturalSort(a, b) {
        let [al, ar] = a.split("-");
        let [bl, br] = b.split("-");
        return al.localeCompare(bl, undefined, {
            numeric: true,
            sensitivity: 'base'
        });
    }

    client.on('message', (channel, tags, message, self) => {
        // console.log(tags);
        // let pronouns = (async(username) => await fetch(`https://pronouns.alejo.io/api/users/${username}`)
        // .then(response => response.json())
        // .then(data => data.data))(tags.username)
        // console.log(pronouns);
        const msg = document.createElement("div");
        if (!config.emoteOnly) {

            const badges = document.createElement("div");
            for (const badge in tags.badges) {
                let num = tags.badges[badge];

                var badgeNode = document.createElement("div");
                badgeNode.innerText = badge;
                switch (badge) {
                    case "subscriber": {
                        let badge = subscriberBadges.find((value, index, obj) => value.id == num);
                        let imgURL = badge.image_url_4x;
                        let imgSet = `${imgData.image_url_1x} 1x, ${imgData.image_url_2x} 2x, ${imgData.image_url_4x} 4x`;
                        const img = document.createElement("img");
                        img.src = imgURL;
                        img.srcset = imgSet;
                        badgeNode = img;
                        break;
                    }
                    case "bits": {
                        let badge = bitsBadges.find((value, index, obj) => value.id == num);
                        let imgURL = badge.image_url_4x;
                        let imgSet = `${imgData.image_url_1x} 1x, ${imgData.image_url_2x} 2x, ${imgData.image_url_4x} 4x`;
                        const img = document.createElement("img");
                        img.src = imgURL;
                        img.srcset = imgSet;
                        badgeNode = img;
                        break;
                    }
                    default:
                        let badgeData = badgesData.find(setIdEquals(badge));
                        if (badgeData) {
                            let imgData = badgeData.versions.find(IdEquals(num));
                            if (imgData) {
                                let imgURL = imgData.image_url_4x;
                                let imgSet = `${imgData.image_url_1x} 1x, ${imgData.image_url_2x} 2x, ${imgData.image_url_4x} 4x`;
                                const img = document.createElement("img");
                                img.src = imgURL;
                                img.srcset = imgSet;
                                badgeNode = img;
                            }
                        }
                        break;
                }
                badges.insertBefore(badgeNode, null);
            }

            // Chatter Name :)
            const name = document.createElement("span");
            name.innerText = tags['display-name'];
            name.style = `color:${tags.color}`;

            name.className = "name";
            badges.className = "badges";

            msg.insertBefore(name, null);
            msg.insertBefore(badges, name);
        }

        const text = document.createElement("div");
        text.className = "message"


        const colon = document.createElement("span");
        colon.innerText = config.emoteOnly ? "" : ":";
        text.insertBefore(colon, null);

        let lastElement = null;
        if (config.enableEmotes) {
            let emotesToReplace = [];
            if (tags.emotes) {
                for (const emote in tags.emotes) {
                    let locations = tags.emotes[emote];
                    let image = emoteCache.find(IdEquals(emote));
                    var imgURL = "";

                    let theme = "light";
                    // let imgScale = "3.0";
                    // imgURL = `https://static-cdn.jtvnw.net/emoticons/v2/${emote}/default/${theme}/${imgScale}`;

                    imgSet = [];
                    for (const scale of ["1", "2", "3"]) {
                        imgSet.push(`https://static-cdn.jtvnw.net/emoticons/v2/${emote}/default/${theme}/${scale}.0 ${scale}x`);
                    }

                    locations.forEach((value, index, array) => {
                        let [start, end] = value.split("-")
                        emotesToReplace.push([parseInt(end), parseInt(start), imgSet]);
                    });
                }
            }

            if (config.customEmotes) {
                let replaceEmotesReverse = []
                for (const index in customEmotes) {
                    let emote = customEmotes[index];
                    let position = 0;
                    do {
                        position = message.indexOf(emote.name, position)

                        if (position != -1) {
                            let [start, end] = [position, position + emote.name.length];
                            replaceEmotesReverse.push([end, start, emote.imgSet]);
                            position = end;
                        }
                    } while (position != -1);
                    position = 0;
                }
                emotesToReplace = emotesToReplace.concat(replaceEmotesReverse.reverse());
            }

            for (const triple in emotesToReplace.sort((a, b) => { return b[0] - a[0] })) {
                let [end, start, imgSet] = emotesToReplace[triple];
                const endTxt = message.slice(end + 1);
                message = message.slice(0, start);

                if (!config.emoteOnly) {
                    if (endTxt) {
                        const txt = document.createElement("span");
                        txt.innerText = endTxt;
                        text.insertBefore(txt, lastElement);
                        lastElement = txt;
                    }
                };
                if (config.enableEmotes) {
                    const emote = document.createElement("img");
                    emote.srcset = imgSet;
                    text.insertBefore(emote, lastElement);
                    lastElement = emote;
                };

            }
        }
        if (!config.emoteOnly) {
            if (message) {
                const txt = document.createElement("div");
                txt.innerText = message;
                text.insertBefore(txt, lastElement);
            }
        }

        msg.className = "chat-message";
        msg.insertBefore(text, null);

        document.getElementById("chatbox").insertBefore(msg, null);
        window.scrollBy({ 'top': window.innerHeight, 'behavior': 'instant' });

    });
}