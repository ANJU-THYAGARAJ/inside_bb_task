const endpoints = [
    "https://jsonplaceholder.typicode.com/posts/1",
    "https://jsonplaceholder.typicode.com/posts/2",
    "https://jsonplaceholder.typicode.com/posts/3"
];


// --------------------------------------------------
// Correct fetch wrapper
// --------------------------------------------------

async function fetchJSON(url) {
    const response = await fetch(url);

    // IMPORTANT:
    // fetch() does NOT reject automatically for 404/500.
    // We must check response.ok ourselves.
    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}: ${response.statusText}`
        );
    }

    return response.json();
}


// --------------------------------------------------
// 1. Sequential requests
// --------------------------------------------------

async function sequential() {
    const start = performance.now();

    const results = [];

    for (const url of endpoints) {
        const data = await fetchJSON(url);
        results.push(data);
    }

    const end = performance.now();

    console.log("\nSEQUENTIAL");
    console.log("Results:", results);
    console.log("Time:", (end - start).toFixed(2), "ms");
}


// --------------------------------------------------
// 2. Parallel requests with Promise.all
// --------------------------------------------------

async function parallel() {
    const start = performance.now();

    const promises = endpoints.map(url => fetchJSON(url));

    const results = await Promise.all(promises);

    const end = performance.now();

    console.log("\nPARALLEL - Promise.all");
    console.log("Results:", results);
    console.log("Time:", (end - start).toFixed(2), "ms");
}


// --------------------------------------------------
// 3. Promise.allSettled
// One endpoint intentionally returns 500
// --------------------------------------------------

async function allSettledExample() {

    const urls = [
        "https://jsonplaceholder.typicode.com/posts/1",

        // Intentional failure
        "https://httpstat.us/500",

        "https://jsonplaceholder.typicode.com/posts/3"
    ];

    const start = performance.now();

    const results = await Promise.allSettled(
        urls.map(url => fetchJSON(url))
    );

    const end = performance.now();

    console.log("\nPROMISE.ALLSETTLED");

    results.forEach((result, index) => {
        if (result.status === "fulfilled") {
            console.log(
                `Request ${index + 1}: SUCCESS`,
                result.value
            );
        } else {
            console.log(
                `Request ${index + 1}: FAILED`,
                result.reason.message
            );
        }
    });

    console.log(
        "Time:",
        (end - start).toFixed(2),
        "ms"
    );
}


// --------------------------------------------------
// 4. Demonstrate the 404 fetch trap
// --------------------------------------------------

async function demonstrate404Trap() {

    const url = "https://jsonplaceholder.typicode.com/posts/999999";

    try {
        const response = await fetch(url);

        console.log("\n404 TRAP");
        console.log("Status:", response.status);
        console.log("response.ok:", response.ok);

        // fetch itself did NOT throw.
        console.log("fetch() completed without throwing");

    } catch (error) {
        console.log("Caught:", error.message);
    }
}


// --------------------------------------------------
// Correct 404 handling
// --------------------------------------------------

async function correct404Handling() {

    const url = "https://jsonplaceholder.typicode.com/posts/999999";

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `HTTP error ${response.status}`
            );
        }

        const data = await response.json();

        console.log(data);

    } catch (error) {
        console.error(
            "Request failed:",
            error.message
        );
    }
}


// --------------------------------------------------
// Run everything
// --------------------------------------------------

async function main() {

    await sequential();

    await parallel();

    await allSettledExample();

    await demonstrate404Trap();

    await correct404Handling();
}

main();