// Setup.js
// Sets up thre RNBO web audio context
/* global RNBO */

async function setup(setCurrentHit) {
    const patchExportURL = "../patch.export.json";

    // Create AudioContext
    const WAContext = window.AudioContext || window.webkitAudioContext;
    const context = new WAContext();

    // Create gain node and connect it to audio output
    const outputNode = context.createGain();
    outputNode.connect(context.destination);
    
    // Fetch the exported patcher
    let response, patcher;
    try {
        response = await fetch(patchExportURL);
        patcher = await response.json();
    
        if (!window.RNBO) {
            // Load RNBO script dynamically
            await loadRNBOScript(patcher.desc.meta.rnboversion);
        }
    } catch (err) {
        // Handle errors in fetching the exported patcher
        console.error("Error fetching the exported patcher:", err);
        return;
    }

    let device;
    try {
        device = await RNBO.createDevice({ context, patcher });
    } catch (err) {
        // Handle errors in creating the RNBO device
        console.error("Error creating RNBO device:", err);
        return;
    }

    // Connect the device to the web audio graph
    device.node.connect(outputNode);

    // Attach listeners to outports to log messages from the RNBO patcher
    attachOutports(device, setCurrentHit);

    document.body.onclick = () => {
        context.resume();
    };

    // Return the configured device
    return device;
}


function loadRNBOScript(version) {
    return new Promise((resolve, reject) => {
        if (/^\d+\.\d+\.\d+-dev$/.test(version)) {
            throw new Error("Patcher exported with a Debug Version!\nPlease specify the correct RNBO version to use in the code.");
        }
        const el = document.createElement("script");
        el.src = "https://c74-public.nyc3.digitaloceanspaces.com/rnbo/" + encodeURIComponent(version) + "/rnbo.min.js";
        el.onload = resolve;
        el.onerror = function(err) {
            console.log(err);
            reject(new Error("Failed to load rnbo.js v" + version));
        };
        document.body.append(el);
    });
}

    function attachOutports(device, setCurrentHit) {
        const consoleDiv = document.getElementById("rnbo-console");
        const noOutportsLabel = document.getElementById("no-outports-label");
        const consoleDivContent = document.getElementById("rnbo-console-div");
    
        const outports = device.outports;
        if (outports.length < 1) {
            if (consoleDiv && consoleDivContent) {
                consoleDiv.removeChild(consoleDivContent);
            }
            return;
        }
    
        if (noOutportsLabel && consoleDiv) {
            consoleDiv.removeChild(noOutportsLabel);
        }    
        device.messageEvent.subscribe((ev) => {
        // Ignore message events that don't belong to an outport
        if (outports.findIndex(elt => elt.tag === ev.tag) < 0) return;

        const consoleReadout = document.getElementById("rnbo-console-readout");
        if (consoleReadout) {
            consoleReadout.innerText = `${ev.tag}: ${ev.payload}`;
        }    
            // Add logic for handling 'currentHit' message
            if (ev.tag === 'currentHit') {
                const hitId = parseInt(ev.payload, 10);
                setCurrentHit(hitId); // Use setCurrentHit here
            }
        });
    
    }



setup();

export default setup;
