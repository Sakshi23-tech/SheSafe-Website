// ========================================
// GLOBAL LOCATION VARIABLES
// ========================================

let locationWatcher = null;

window.sosLatitude = undefined;
window.sosLongitude = undefined;


// ========================================
// LIVE LOCATION
// ========================================

function startLiveLocation() {

    const status =
        document.getElementById("locationStatus");

    const time =
        document.getElementById("locationTime");


    if (!navigator.geolocation) {

        status.innerText =
            "Geolocation is not supported.";

        return;
    }


    status.innerText =
        "Requesting location permission...";


    if (locationWatcher !== null) {

        navigator.geolocation.clearWatch(
            locationWatcher
        );

    }


    locationWatcher =
        navigator.geolocation.watchPosition(

            function(position) {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;


                document.getElementById("latitude").innerText =
                    latitude.toFixed(6);

                document.getElementById("longitude").innerText =
                    longitude.toFixed(6);


                status.innerText =
                    "🟢 Location is active";


                const now = new Date();

                time.innerText =
                    "Last updated: " +
                    now.toLocaleTimeString();


                const mapURL =
                    "https://www.google.com/maps/search/?api=1&query=" +
                    latitude +
                    "," +
                    longitude;


                const mapLink =
                    document.getElementById("mapLink");


                mapLink.href = mapURL;

                mapLink.style.display =
                    "inline-block";


                fetch("/location", {

                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        latitude: latitude,

                        longitude: longitude

                    })

                }).catch(error => {

                    console.log(
                        "Location server update failed:",
                        error
                    );

                });

            },


            function(error) {

                if (error.code === 1) {

                    status.innerText =
                        "❌ Location permission denied.";

                }

                else if (error.code === 2) {

                    status.innerText =
                        "❌ Location unavailable.";

                }

                else {

                    status.innerText =
                        "❌ Unable to get location.";

                }

            },


            {

                enableHighAccuracy: true,

                timeout: 10000,

                maximumAge: 5000

            }

        );
}


// ========================================
// STOP LOCATION
// ========================================

function stopLiveLocation() {

    if (locationWatcher !== null) {

        navigator.geolocation.clearWatch(
            locationWatcher
        );

        locationWatcher = null;

    }


    document.getElementById(
        "locationStatus"
    ).innerText =
        "🔴 Location tracking stopped";


    document.getElementById(
        "locationTime"
    ).innerText =
        "Press Start Location to begin again.";
}


// ========================================
// SOS
// ========================================

function emergencySOS() {

    document.getElementById(
        "sosScreen"
    ).style.display = "flex";

    document.getElementById("systemStatus").innerText =
               "Emergency Mode Active";


    loadSOSContacts();


    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(

            function(position) {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;


                window.sosLatitude =
                    latitude;

                window.sosLongitude =
                    longitude;


                document.getElementById(
                    "sosLocation"
                ).innerText =
                    latitude.toFixed(6) +
                    ", " +
                    longitude.toFixed(6);

            },


            function() {

                document.getElementById(
                    "sosLocation"
                ).innerText =
                    "Unable to access location.";

            },

            {

                enableHighAccuracy: true,

                timeout: 10000,

                maximumAge: 5000

            }

        );

    }

    else {

        document.getElementById(
            "sosLocation"
        ).innerText =
            "Location is not supported.";

    }
}


// ========================================
// SOS MAP
// ========================================

function openSOSMap() {

    if (
        window.sosLatitude === undefined ||
        window.sosLongitude === undefined
    ) {

        alert(
            "Current location is not available yet."
        );

        return;
    }


    const mapURL =
        "https://www.google.com/maps/search/?api=1&query=" +
        window.sosLatitude +
        "," +
        window.sosLongitude;


    window.open(
        mapURL,
        "_blank"
    );
}


// ========================================
// CLOSE SOS
// ========================================

function closeSOS() {

    document.getElementById("sosScreen").style.display = "none";

    document.getElementById("systemStatus").innerText =
        "System Ready";
    
}


// ========================================
// SAVE CONTACT
// ========================================

function saveContact() {

    const name =
        document.getElementById(
            "contactName"
        ).value.trim();


    const phone =
        document.getElementById(
            "contactPhone"
        ).value.trim();


    const message =
        document.getElementById(
            "contactMessage"
        );


    if (!name || !phone) {

        message.innerText =
            "Please enter name and phone number.";

        return;
    }


    fetch("/save-contact", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            name: name,

            phone: phone

        })

    })

    .then(response => response.json())

    .then(data => {

        message.innerText =
            data.message;


        if (data.success) {

            document.getElementById(
                "contactName"
            ).value = "";


            document.getElementById(
                "contactPhone"
            ).value = "";


            loadContacts();

        }

    })

    .catch(error => {

        console.error(error);

        message.innerText =
            "Something went wrong.";

    });
}


// ========================================
// LOAD CONTACTS
// ========================================

function loadContacts() {

    fetch("/contacts")

        .then(response => response.json())

        .then(contacts => {

            const list =
                document.getElementById(
                    "contactsList"
                );


            list.innerHTML = "";


            if (contacts.length === 0) {

                list.innerHTML =
                    "<p>No contacts added yet.</p>";

                return;
            }


            contacts.forEach(contact => {

                const div =
                    document.createElement("div");


                div.className =
                    "contact-item";


                div.innerHTML = `

                    <div>

                        <strong>
                            ${contact.name}
                        </strong>

                        <br>

                        <span>
                            ${contact.phone}
                        </span>

                    </div>


                    <div>

                        <a
                            href="tel:${contact.phone}"
                            class="call-contact">

                            📞

                        </a>


                        <button
                            onclick="deleteContact(${contact.id})">

                            Delete

                        </button>

                    </div>

                `;


                list.appendChild(div);

            });

        })

        .catch(error =>
            console.error(error)
        );
}


// ========================================
// DELETE CONTACT
// ========================================

function deleteContact(id) {

    fetch(
        "/delete-contact/" + id,
        {
            method: "DELETE"
        }
    )

    .then(response => response.json())

    .then(() => {

        loadContacts();

    })

    .catch(error =>
        console.error(error)
    );
}


// ========================================
// SAFETY ASSISTANT
// ========================================

function askAI() {

    const question =
        document.getElementById(
            "question"
        ).value.trim();


    const answerBox =
        document.getElementById(
            "answerBox"
        );


    if (!question) {

        answerBox.style.display =
            "block";


        answerBox.innerText =
            "Please type a question.";

        return;
    }


    answerBox.style.display =
        "block";


    answerBox.innerText =
        "Thinking...";


    fetch("/ask-ai", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            question: question

        })

    })

    .then(response => response.json())

    .then(data => {

        answerBox.innerText =
            data.answer;

    })

    .catch(error => {

        console.error(error);

        answerBox.innerText =
            "Unable to connect to the safety assistant.";

    });
}


// ========================================
// NEARBY SAFE PLACES
// ========================================

function findNearby(placeType) {

    const status =
        document.getElementById(
            "safePlaceStatus"
        );


    if (!navigator.geolocation) {

        status.innerText =
            "Location is not supported by your browser.";

        return;
    }


    status.innerText =
        "📍 Getting your current location...";


    navigator.geolocation.getCurrentPosition(

        function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            const mapsURL =
                "https://www.google.com/maps/search/" +
                encodeURIComponent(placeType) +
                "/@" +
                latitude +
                "," +
                longitude +
                ",14z";


            status.innerText =
                "✅ Opening nearby " +
                placeType +
                "s on Google Maps...";


            window.open(
                mapsURL,
                "_blank"
            );

        },


        function(error) {

            if (error.code === 1) {

                status.innerText =
                    "❌ Location permission was denied.";

            }

            else {

                status.innerText =
                    "❌ Unable to get your location.";

            }

        },


        {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 5000

        }

    );
}


// ========================================
// SOS CONTACTS
// ========================================

function loadSOSContacts() {

    fetch("/contacts")

        .then(response => response.json())

        .then(contacts => {

            const list =
                document.getElementById(
                    "sosContactsList"
                );


            list.innerHTML = "";


            if (contacts.length === 0) {

                list.innerHTML =
                    "<p>No trusted contacts added.</p>";

                return;
            }


            contacts.forEach(contact => {

                const div =
                    document.createElement("div");


                div.className =
                    "sos-contact";


                div.innerHTML = `

                    <div>

                        <strong>
                            ${contact.name}
                        </strong>

                        <br>

                        <span>
                            ${contact.phone}
                        </span>

                    </div>


                    <a href="tel:${contact.phone}">

                        📞 Call

                    </a>

                `;


                list.appendChild(div);

            });

        })

        .catch(error => {

            console.error(error);


            document.getElementById(
                "sosContactsList"
            ).innerHTML =
                "<p>Unable to load contacts.</p>";

        });
}


// ========================================
// LOAD CONTACTS WHEN PAGE OPENS
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadContacts();

    }
);