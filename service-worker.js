var CORE_CACHE_NAME = "spnati-v1";
var DYNAMIC_CACHE_NAME = "spnati-dynamic-v1";

var cache_on_install = [
    '/',
    '/css/spni.css',
    '/css/spniDialogueUtilities.css',
    '/css/bootstrap-theme.min.css',
    '/css/bootstrap.min.css',
    '/js/bootstrap.min.js',
    '/js/jquery-1.11.3.min.js',
    '/js/js.cookie.js',
    '/js/pako.min.js',
    '/js/player.js',
    '/js/table.js',
    '/js/save.js',
    '/js/spniCore.js',
    '/js/spniDevMode.js',
    '/js/spniDisplay.js',
    '/js/spniTitle.js',
    '/js/spniSelect.js',
    '/js/spniGame.js',
    '/js/spniPoker.js',
    '/js/spniClothing.js',
    '/js/spniForfeit.js',
    '/js/spniBehaviour.js',
    '/js/spniAI.js',
    '/js/spniOption.js',
    '/js/spniEpilogue.js',
    '/js/spniGallery.js',
    '/img/any.png',
    '/img/bisexual.jpg',
    '/img/all.png',
    '/img/blank.png',
    '/img/enter.png',
    '/img/epilogue_icon.png',
    '/img/female.png',
    '/img/female_small.png',
    '/img/female_medium.png',
    '/img/female_large.png',
    '/img/male.png',
    '/img/male_small.png',
    '/img/male_medium.png',
    '/img/male_large.png',
    '/img/gallery.svg',
    '/img/unknown.jpg',
    '/img/unknown_s.jpg',
    '/img/title.png',
    '/img/poker-hands-help.jpg',
    '/img/testing-badge.png',
    '/img/reddit.png',
    '/img/backgrounds/inventory.png',
]

self.addEventListener('install', function (event) {
    for (var i = 1; i < 10; i++) {
        cache_on_install.push('/img/layers' + i + '.png');
    }

    ['spade', 'clubs', 'heart', 'diamo'].forEach(function (suit) {
        cache_on_install.push('/img/' + suit + '.jpg');
        for (var i = 1; i < 14; i++) {
            cache_on_install.push('/img/' + suit + i + '.jpg');
        }
    });

    event.waitUntil(
        caches.open(CORE_CACHE_NAME)
        .then(function (cache) {
            return cache.addAll(cache_on_install);
        })
    );
});

self.addEventListener('fetch', function (event) {
    var url = new URL(event.request.url);

    if (url.pathname.startsWith('/opponents/') || url.pathname.startsWith('/img/backgrounds/') || url.pathname.endsWith('.xml')) {
        /* For data in opponents/, background images, or any data XML files:
         * go to network first, but fall back to cache if offline.
         */

        event.respondWith(
            caches.open(DYNAMIC_CACHE_NAME)
            .then(function (cache) {
                return fetch(event.request).then(function (response) {
                    cache.put(event.request, response.clone());
                    return response;
                }).catch(function () {
                    return caches.match(event.request);
                });
            })
        );
    } else {
        /* For everything else: serve from cache first, falling back to network */
        event.respondWith(
            caches.match(event.request).then(function (response) {
                return response || fetch(event.request);
            })
        );
    }
});