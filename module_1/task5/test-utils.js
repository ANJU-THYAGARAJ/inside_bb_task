const {
    myMap,
    myFilter,
    myReduce,
    debounce,
    throttle,
    deepClone,
    once
} = require("./utils");


// myMap
console.log(
    "myMap:",
    myMap([1, 2, 3], n => n * 2)
);


// myFilter
console.log(
    "myFilter:",
    myFilter([1, 2, 3, 4], n => n % 2 === 0)
);


// myReduce
console.log(
    "myReduce:",
    myReduce([1, 2, 3, 4], (sum, n) => sum + n, 0)
);


// deepClone
const original = {
    name: "Anju",
    address: {
        city: "Kochi"
    },
    numbers: [1, 2, 3],
    date: new Date("2026-01-01")
};

const copy = deepClone(original);

copy.address.city = "Thrissur";
copy.numbers.push(4);

console.log("Original:", original);
console.log("Copy:", copy);


// once
const sayHello = once(() => {
    console.log("Function executed");
    return "Hello";
});

console.log(sayHello());
console.log(sayHello());
console.log(sayHello());