
function myMap(arr, callback) {
    const result = [];

    for (let i = 0; i < arr.length; i++) {
        result.push(callback(arr[i], i, arr));
    }

    return result;
}

function myFilter(arr, callback) {
    const result = [];

    for (let i = 0; i < arr.length; i++) {
        if (callback(arr[i], i, arr)) {
            result.push(arr[i]);
        }
    }

    return result;
}

function myReduce(arr, callback, initialValue) {
    let accumulator;
    let startIndex;

    if (arguments.length >= 3) {
        accumulator = initialValue;
        startIndex = 0;
    } else {
        if (arr.length === 0) {
            throw new TypeError("Reduce of empty array with no initial value");
        }

        accumulator = arr[0];
        startIndex = 1;
    }

    for (let i = startIndex; i < arr.length; i++) {
        accumulator = callback(
            accumulator,
            arr[i],
            i,
            arr
        );
    }

    return accumulator;
}
function debounce(fn, ms) {
    let timer;

    return function (...args) {
        clearTimeout(timer);

        timer = setTimeout(() => {
            fn.apply(this, args);
        }, ms);
    };
}


function throttle(fn, ms) {
    let lastRun = 0;

    return function (...args) {
        const now = Date.now();

        if (now - lastRun >= ms) {
            lastRun = now;
            fn.apply(this, args);
        }
    };
}

function deepClone(obj, seen = new WeakMap()) {

    // Primitive values
    if (obj === null || typeof obj !== "object") {
        return obj;
    }

    // Handle circular references
    if (seen.has(obj)) {
        return seen.get(obj);
    }

    // Handle Date
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    // Handle Array
    if (Array.isArray(obj)) {
        const clonedArray = [];

        seen.set(obj, clonedArray);

        for (let i = 0; i < obj.length; i++) {
            clonedArray[i] = deepClone(obj[i], seen);
        }

        return clonedArray;
    }

    // Handle normal object
    const clonedObject = {};

    seen.set(obj, clonedObject);

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            clonedObject[key] = deepClone(obj[key], seen);
        }
    }

    return clonedObject;
}


// --------------------------------------------------
// once
// Function runs only the first time it is called
// --------------------------------------------------
function once(fn) {
    let hasRun = false;
    let result;

    return function (...args) {

        if (!hasRun) {
            hasRun = true;
            result = fn.apply(this, args);
        }

        return result;
    };
}


// --------------------------------------------------
// Export functions
// --------------------------------------------------
module.exports = {
    myMap,
    myFilter,
    myReduce,
    debounce,
    throttle,
    deepClone,
    once
};