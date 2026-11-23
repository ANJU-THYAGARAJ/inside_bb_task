const API_URL = "/tasks/";

const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const searchInput = document.querySelector("#searchInput");
const taskList = document.querySelector("#taskList");
const statusBox = document.querySelector("#status");

let tasks = [];

function showStatus(message, type = "") {
    statusBox.textContent = message;
    statusBox.className = "status " + type;
}

async function loadTasks(search = "") {

    showStatus("Loading tasks...", "loading");

    try {

        const url = search
            ? `${API_URL}?search=${encodeURIComponent(search)}`
            : API_URL;

        const response = await fetch(url);

        // Requirement: explicitly check res.ok
        if (!response.ok) {
            throw new Error(
                `Request failed with status ${response.status}`
            );
        }

        const data = await response.json();

        tasks = data;

        renderTasks(tasks);

    } catch (error) {

        showStatus(
            "Unable to load tasks. Please try again.",
            "error"
        );

        taskList.replaceChildren();
    }
}

function renderTasks(taskData) {

    taskList.replaceChildren();

    if (taskData.length === 0) {

        showStatus(
            "No tasks found.",
            "empty"
        );

        return;
    }

    showStatus("");

    const fragment = document.createDocumentFragment();

    taskData.forEach(task => {

        const li = document.createElement("li");

        li.className = "task";

        li.dataset.id = task.id;

        if (task.completed) {
            li.classList.add("completed");
        }

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.className = "complete-btn";
        checkbox.checked = task.completed;

        const title = document.createElement("span");

        title.className = "task-title";
        title.innerHTML = task.title;

        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.className = "edit-btn";
        editButton.textContent = "Edit";

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        li.append(
            checkbox,
            title,
            editButton,
            deleteButton
        );

        fragment.appendChild(li);
    });

    taskList.appendChild(fragment);
}

taskForm.addEventListener("submit", async event => {

    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) {
        return;
    }

    const temporaryTask = {
        id: `temp-${Date.now()}`,
        title: title,
        completed: false,
        optimistic: true
    };

    tasks.unshift(temporaryTask);

    renderTasks(tasks);

    taskInput.value = "";

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                title: title
            })
        });

        if (!response.ok) {
            throw new Error("Add request failed");
        }

        const savedTask = await response.json();

        const index = tasks.findIndex(
            task => task.id === temporaryTask.id
        );

        if (index !== -1) {
            tasks[index] = savedTask;
        }

        renderTasks(tasks);

    } catch (error) {

        tasks = tasks.filter(
            task => task.id !== temporaryTask.id
        );

        renderTasks(tasks);

        showStatus(
            "Add failed. The task was rolled back.",
            "error"
        );
    }
});

taskList.addEventListener("click", async event => {

    const taskElement = event.target.closest(".task");

    if (!taskElement) {
        return;
    }

    const taskId = taskElement.dataset.id;

    const task = tasks.find(
        item => String(item.id) === String(taskId)
    );

    if (!task) {
        return;
    }

    if (event.target.classList.contains("delete-btn")) {

        const originalTasks = [...tasks];

        // Optimistic deletion
        tasks = tasks.filter(
            item => String(item.id) !== String(taskId)
        );

        renderTasks(tasks);

        try {

            const response = await fetch(
                `${API_URL}${taskId}/`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {
                throw new Error("Delete failed");
            }

        } catch (error) {

            tasks = originalTasks;

            renderTasks(tasks);

            showStatus(
                "Delete failed. Task restored.",
                "error"
            );
        }
    }

    if (event.target.classList.contains("complete-btn")) {

        const originalCompleted = task.completed;

        task.completed = !originalCompleted;

        renderTasks(tasks);

        try {

            const response = await fetch(
                `${API_URL}${taskId}/`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        completed: task.completed
                    })
                }
            );

            if (!response.ok) {
                throw new Error("Toggle failed");
            }

        } catch (error) {

            task.completed = originalCompleted;

            renderTasks(tasks);

            showStatus(
                "Update failed. Change rolled back.",
                "error"
            );
        }
    }

    if (event.target.classList.contains("edit-btn")) {

        const oldTitle = task.title;

        const input = document.createElement("input");

        input.className = "edit-input";
        input.value = oldTitle;

        const saveButton = document.createElement("button");

        saveButton.textContent = "Save";
        saveButton.className = "save-btn";

        taskElement.replaceChildren(
            input,
            saveButton
        );

        input.focus();

        saveButton.addEventListener("click", async () => {

            const newTitle = input.value.trim();

            if (!newTitle) {
                return;
            }

            task.title = newTitle;

            renderTasks(tasks);

            try {

                const response = await fetch(
                    `${API_URL}${taskId}/`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            title: newTitle
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error("Edit failed");
                }

            } catch (error) {

                task.title = oldTitle;

                renderTasks(tasks);

                showStatus(
                    "Edit failed. Original title restored.",
                    "error"
                );
            }
        });
    }

});

let searchTimer = null;
let searchController = null;

searchInput.addEventListener("input", () => {

    clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {

        searchTasks(searchInput.value.trim());

    }, 300);
});


async function searchTasks(search) {

    if (searchController) {
        searchController.abort();
    }

    searchController = new AbortController();

    showStatus("Searching...", "loading");

    try {

        const url =
            `${API_URL}?search=${encodeURIComponent(search)}`;

        const response = await fetch(url, {
            signal: searchController.signal
        });

        if (!response.ok) {
            throw new Error(
                `Search failed: ${response.status}`
            );
        }

        const data = await response.json();

        tasks = data;

        renderTasks(tasks);

    } catch (error) {

        if (error.name === "AbortError") {
            return;
        }

        showStatus(
            "Search failed.",
            "error"
        );
    }
}

let scrollTimeout = null;

window.addEventListener("scroll", () => {

    if (scrollTimeout !== null) {
        return;
    }

    scrollTimeout = setTimeout(() => {

        console.log(
            "Scroll position:",
            window.scrollY
        );

        scrollTimeout = null;

    }, 100);

});

/*
Why throttle instead of debounce?

Scroll events can fire many times while the user is scrolling.
We want periodic updates during the scroll, rather than waiting
until scrolling completely stops.

Therefore throttle is appropriate here.
*/

function performanceTest() {

    const items = Array.from(
        { length: 5000 },
        (_, index) => `Task ${index + 1}`
    );

    const container1 = document.createElement("div");

    let start = performance.now();

    items.forEach(item => {

        const element = document.createElement("div");

        element.textContent = item;

        container1.appendChild(element);
    });

    let loopTime = performance.now() - start;

    const container2 = document.createElement("div");

    const fragment = document.createDocumentFragment();

    start = performance.now();

    items.forEach(item => {

        const element = document.createElement("div");

        element.textContent = item;

        fragment.appendChild(element);
    });

    container2.appendChild(fragment);

    let fragmentTime = performance.now() - start;


    console.table({
        "appendChild loop": `${loopTime.toFixed(2)} ms`,
        "DocumentFragment": `${fragmentTime.toFixed(2)} ms`,
        "difference": `${(loopTime - fragmentTime).toFixed(2)} ms`
    });

    return {
        loopTime,
        fragmentTime
    };
}

loadTasks();
function setStatus(message) {

    statusBox.textContent = message;

}


function setError(message) {

    errorBox.textContent = message;

}


function clearMessages() {

    setError("");

}
function renderTasks() {

    list.textContent = "";


    // EMPTY STATE

    if (tasks.length === 0) {

        const empty =
            document.createElement("p");

        empty.className = "empty";

        empty.textContent =
            "No tasks found.";

        list.appendChild(empty);

        return;
    }


    const fragment =
        document.createDocumentFragment();


    for (const task of tasks) {

        const article =
            document.createElement("article");

        article.className =
            "task" +
            (
                task.completed
                    ? " completed"
                    : ""
            );

        article.dataset.id =
            task.id;


        // CHECKBOX

        const checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.checked =
            task.completed;

        checkbox.dataset.action =
            "toggle";

        checkbox.setAttribute(
            "aria-label",
            "Toggle task"
        );


        // TITLE

        const title =
            document.createElement("span");

        title.className =
            "task-title";


        // IMPORTANT:
        // Never use innerHTML for user input.
        title.textContent =
            task.title;


        // BUTTON CONTAINER

        const actions =
            document.createElement("div");

        actions.className =
            "task-actions";


        // EDIT

        const edit =
            document.createElement("button");

        edit.type = "button";

        edit.dataset.action =
            "edit";

        edit.textContent =
            "Edit";


        // DELETE

        const del =
            document.createElement("button");

        del.type = "button";

        del.dataset.action =
            "delete";

        del.textContent =
            "Delete";


        actions.append(
            edit,
            del
        );


        article.append(
            checkbox,
            title,
            actions
        );


        fragment.appendChild(
            article
        );
    }


    list.appendChild(fragment);
}
list.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (
            !button ||
            !list.contains(button)
        ) {
            return;
        }


        const article =
            button.closest(".task");


        if (!article) {
            return;
        }


        const id =
            Number(article.dataset.id);


        const task =
            tasks.find(
                (t) => t.id === id
            );


        if (!task) {
            return;
        }


        // EDIT

        if (
            button.dataset.action ===
            "edit"
        ) {

            const newTitle =
                prompt(
                    "Edit task:",
                    task.title
                );


            if (newTitle === null) {
                return;
            }


            const title =
                newTitle.trim();


            if (!title) {
                return;
            }


            await updateTaskOptimistically(
                id,
                {
                    title: title
                }
            );
        }


        // DELETE

        if (
            button.dataset.action ===
            "delete"
        ) {

            await deleteTaskOptimistically(
                id
            );
        }

    }
);
list.addEventListener(
    "change",
    async (event) => {

        if (
            !event.target.matches(
                '[data-action="toggle"]'
            )
        ) {
            return;
        }


        const article =
            event.target.closest(".task");


        const id =
            Number(article.dataset.id);


        const task =
            tasks.find(
                (t) => t.id === id
            );


        if (!task) {
            return;
        }


        await updateTaskOptimistically(
            id,
            {
                completed:
                    !task.completed
            }
        );

    }
);
async function loadTasks(
    url = API_URL,
    signal
) {

    setStatus("Loading...");

    clearMessages();


    try {

        const res =
            await fetch(
                url,
                {
                    signal: signal
                }
            );


        // IMPORTANT:
        // fetch() does NOT reject automatically
        // for HTTP 400/500 responses.
        if (!res.ok) {

            throw new Error(
                `API request failed: ` +
                `${res.status} ` +
                `${res.statusText}`
            );
        }


        tasks =
            await res.json();


        renderTasks();


        setStatus(
            `${tasks.length} task` +
            `${tasks.length === 1 ? "" : "s"} loaded.`
        );

    }

    catch (error) {

        // AbortController cancellation
        // is not treated as an error.
        if (
            error.name ===
            "AbortError"
        ) {
            return;
        }


        setStatus("");


        setError(
            `Could not load tasks: ` +
            `${error.message}`
        );


        list.textContent = "";
    }
}
async function updateTaskOptimistically(
    id,
    patch
) {

    const index =
        tasks.findIndex(
            (task) =>
                task.id === id
        );


    if (index === -1) {
        return;
    }


    // Save old state for rollback.
    const previous = {
        ...tasks[index]
    };


    // Update UI immediately.
    tasks[index] = {
        ...tasks[index],
        ...patch
    };


    renderTasks();


    setStatus(
        "Saving..."
    );


    try {

        const res =
            await fetch(
                `${API_URL}${id}/`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(patch)
                }
            );


        if (!res.ok) {

            throw new Error(
                `Update failed: ` +
                `${res.status}`
            );
        }


        tasks[index] =
            await res.json();


        renderTasks();


        setStatus(
            "Saved."
        );

    }

    catch (error) {

        // ROLLBACK
        tasks[index] =
            previous;


        renderTasks();


        setError(
            `Update failed; optimistic ` +
            `update rolled back: ` +
            `${error.message}`
        );
    }
}
async function deleteTaskOptimistically(
    id
) {

    const index =
        tasks.findIndex(
            (task) =>
                task.id === id
        );


    if (index === -1) {
        return;
    }


    const previous =
        tasks[index];


    // Remove immediately.
    tasks.splice(
        index,
        1
    );


    renderTasks();


    setStatus(
        "Deleting..."
    );


    try {

        const res =
            await fetch(
                `${API_URL}${id}/`,
                {
                    method: "DELETE"
                }
            );


        if (!res.ok) {

            throw new Error(
                `Delete failed: ` +
                `${res.status}`
            );
        }


        setStatus(
            "Deleted."
        );

    }

    catch (error) {

        // ROLLBACK
        tasks.splice(
            index,
            0,
            previous
        );


        renderTasks();


        setError(
            `Delete failed; optimistic ` +
            `update rolled back: ` +
            `${error.message}`
        );
    }
}
searchInput.addEventListener(
    "input",
    () => {

        // Cancel previous debounce timer.
        clearTimeout(
            searchTimer
        );


        // Cancel previous network request.
        if (searchController) {

            searchController.abort();
        }


        // Wait 300ms after typing stops.
        searchTimer =
            setTimeout(
                async () => {

                    const q =
                        searchInput.value.trim();


                    searchController =
                        new AbortController();


                    await loadTasks(
                        `${API_URL}?q=` +
                        encodeURIComponent(q),

                        searchController.signal
                    );

                },
                300
            );
    }
);