const API_URL =
    "https://jsonplaceholder.typicode.com/todos?_limit=12";

const POST_URL =
    "https://jsonplaceholder.typicode.com/todos";

const STORAGE_KEY =
    "taskflow.tasks.v1";


const app =
    document.querySelector("#app");

const main =
    document.querySelector("#main-content");

const state = {

    tasks: [],

    status: "loading",

    error: "",

    query: "",

    filter: "all",

    demo: false

};


document.addEventListener(
    "click",
    (event) => {

        const link =
            event.target.closest(
                "a[href^='#']"
            );

        if (!link) {
            return;
        }

        window.requestAnimationFrame(() => {

            main.focus({
                preventScroll: true
            });

        });

    }
);

window.addEventListener(
    "hashchange",
    renderRoute
);


function loadLocalTasks() {

    try {

        const raw =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!raw) {
            return [];
        }

        const parsed =
            JSON.parse(raw);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch {

        return [];

    }

}

function saveLocalTasks() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state.tasks)
    );

}
function escapeForId(value) {

    return String(value)
        .replace(
            /[^a-zA-Z0-9_-]/g,
            "-"
        );

}

async function fetchTasks() {

    state.status = "loading";

    state.error = "";

    renderTasksView();


    try {

        const response =
            await fetch(
                API_URL,
                {
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `Request failed with status ${response.status}.`
            );

        }


        const apiTasks =
            await response.json();


        const localTasks =
            loadLocalTasks();


        const merged =
            [...localTasks];


        const localIds =
            new Set(
                localTasks.map(
                    task => String(task.id)
                )
            );


        for (const task of apiTasks) {

            if (
                !localIds.has(
                    String(task.id)
                )
            ) {

                merged.push({

                    id: task.id,

                    title: task.title,

                    completed:
                        Boolean(task.completed),

                    source: "API"

                });

            }

        }


        state.tasks = merged;


        saveLocalTasks();


        state.status = "success";

    } catch (error) {

        state.status = "error";

        state.error =
            error instanceof Error
                ? error.message
                : "Unable to load tasks.";

    }


    renderTasksView();

}

function filteredTasks() {

    const query =
        state.query
            .trim()
            .toLowerCase();


    return state.tasks.filter(
        task => {

            const matchesText =
                !query ||
                task.title
                    .toLowerCase()
                    .includes(query);


            const matchesFilter =

                state.filter === "all"

                ||

                (
                    state.filter === "active"
                    &&
                    !task.completed
                )

                ||

                (
                    state.filter === "completed"
                    &&
                    task.completed
                );


            return (
                matchesText &&
                matchesFilter
            );

        }
    );

}

function taskListHTML(tasks) {

    const list =
        document.createElement("ul");


    list.className =
        "task-list";


    list.setAttribute(
        "aria-label",
        "Tasks"
    );


    for (const task of tasks) {

        const item =
            document.createElement("li");


        item.className =
            "task";

        const checkbox =
            document.createElement("input");


        checkbox.type =
            "checkbox";


        checkbox.checked =
            task.completed;


        checkbox.id =
            `task-${escapeForId(task.id)}`;


        checkbox.setAttribute(
            "aria-label",
            `Mark "${task.title}" as complete`
        );


        checkbox.addEventListener(
            "change",
            () => toggleTask(task.id)
        );


        const content =
            document.createElement("div");


        const title =
            document.createElement("p");


        title.className =
            `task-title${
                task.completed
                    ? " done"
                    : ""
            }`;

        title.textContent =
            task.title;


        const meta =
            document.createElement("p");


        meta.className =
            "task-meta";


        meta.textContent =
            `Source: ${
                task.source || "Browser"
            } · ID: ${task.id}`;


        content.append(
            title,
            meta
        );

        const remove =
            document.createElement("button");


        remove.type =
            "button";


        remove.className =
            "button-secondary";


        remove.textContent =
            "Remove";


        remove.setAttribute(
            "aria-label",
            `Remove "${task.title}"`
        );


        remove.addEventListener(
            "click",
            () => removeTask(task.id)
        );


        item.append(
            checkbox,
            content,
            remove
        );


        list.append(item);

    }


    return list;

}


function renderTasksView() {

    const section =
        document.createElement("section");


    section.setAttribute(
        "aria-labelledby",
        "tasks-heading"
    );

    const header =
        document.createElement("div");


    header.className =
        "hero";


    const eyebrow =
        document.createElement("p");


    eyebrow.className =
        "eyebrow";


    eyebrow.textContent =
        "Task library";


    const heading =
        document.createElement("h1");


    heading.id =
        "tasks-heading";


    heading.textContent =
        "Tasks";


    const intro =
        document.createElement("p");

    header.append(
        eyebrow,
        heading,
        intro
    );


    section.append(header);

    if (state.status === "loading") {

        const live =
            document.createElement("p");


        live.className =
            "message";


        live.textContent =
            "Loading tasks…";


        live.setAttribute(
            "role",
            "status"
        );


        section.append(live);


        const skeleton =
            document.createElement("div");


        skeleton.className =
            "skeleton-list";


        skeleton.setAttribute(
            "aria-hidden",
            "true"
        );


        for (
            let i = 0;
            i < 5;
            i++
        ) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "skeleton";


            skeleton.append(row);

        }


        section.append(skeleton);


        app.replaceChildren(section);

        return;

    }

    if (state.status === "error") {

        const errorBox =
            document.createElement("div");


        errorBox.className =
            "message message-error";


        errorBox.setAttribute(
            "role",
            "alert"
        );


        const text =
            document.createElement("p");


        text.textContent =
            `Could not load tasks. ${state.error}`;


        const retry =
            document.createElement("button");


        retry.type =
            "button";


        retry.className =
            "button-primary";


        retry.textContent =
            "Retry";


        retry.addEventListener(
            "click",
            fetchTasks
        );


        errorBox.append(
            text,
            retry
        );


        section.append(errorBox);


        app.replaceChildren(section);

        return;

    }

    const toolbar =
        document.createElement("div");


    toolbar.className =
        "toolbar";

    const searchField =
        document.createElement("div");


    const searchLabel =
        document.createElement("label");


    searchLabel.htmlFor =
        "task-search";


    searchLabel.textContent =
        "Search tasks";


    const search =
        document.createElement("input");


    search.id =
        "task-search";


    search.type =
        "search";


    search.placeholder =
        "Type a task name…";


    search.value =
        state.query;


    search.addEventListener(
        "input",
        () => {

            state.query =
                search.value;


            renderTasksView();


            document
                .querySelector(
                    "#task-search"
                )
                ?.focus();

        }
    );


    searchField.append(
        searchLabel,
        search
    );


    const filterField =
        document.createElement("div");


    const filterLabel =
        document.createElement("label");


    filterLabel.htmlFor =
        "task-filter";


    filterLabel.textContent =
        "Filter";


    const filter =
        document.createElement("select");


    filter.id =
        "task-filter";


    const options = [

        ["all", "All tasks"],

        ["active", "Active"],

        ["completed", "Completed"]

    ];


    options.forEach(
        ([value, label]) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                value;


            option.textContent =
                label;


            option.selected =
                state.filter === value;


            filter.append(option);

        }
    );


    filter.addEventListener(
        "change",
        () => {

            state.filter =
                filter.value;


            renderTasksView();

        }
    );


    filterField.append(
        filterLabel,
        filter
    );


    toolbar.append(
        searchField,
        filterField
    );


    section.append(toolbar);

    const tasks =
        filteredTasks();


    const summary =
        document.createElement("p");


    summary.className =
        "task-meta";


    summary.setAttribute(
        "aria-live",
        "polite"
    );


    summary.textContent =
        `${tasks.length} task${
            tasks.length === 1
                ? ""
                : "s"
        } shown.`;


    section.append(summary);



    if (tasks.length === 0) {

        const empty =
            document.createElement("div");


        empty.className =
            "message message-empty";


        empty.setAttribute(
            "role",
            "status"
        );


        const title =
            document.createElement("h2");


        title.textContent =
            "No tasks found";


        const text =
            document.createElement("p");


        text.textContent =
            state.tasks.length

                ? "Try a different search or filter."

                : "Your task list is empty. Add your first task.";


        empty.append(
            title,
            text
        );


        section.append(empty);

    } else {

        section.append(
            taskListHTML(tasks)
        );

    }


    app.replaceChildren(section);

}

function toggleTask(id) {

    state.tasks =
        state.tasks.map(
            task =>

                task.id === id

                    ? {
                        ...task,
                        completed:
                            !task.completed
                    }

                    : task
        );


    saveLocalTasks();

    renderTasksView();

}


function removeTask(id) {

    state.tasks =
        state.tasks.filter(
            task =>
                task.id !== id
        );


    saveLocalTasks();

    renderTasksView();

}


async function submitTask(event) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const titleInput =
        form.elements.title;


    const descriptionInput =
        form.elements.description;


    const submit =
        form.querySelector(
            "button[type='submit']"
        );


    const message =
        form.querySelector(
            "[data-form-message]"
        );


    const title =
        titleInput.value.trim();


    if (!title) {
        return;
    }


    submit.disabled = true;


    message.textContent =
        "Saving task…";


    message.className =
        "message";


    message.setAttribute(
        "role",
        "status"
    );


    try {

        const response =
            await fetch(
                POST_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Accept:
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            title,
                            completed: false,
                            userId: 1
                        })
                }
            );


        if (!response.ok) {

            throw new Error(
                `Request failed with status ${response.status}.`
            );

        }


        const created =
            await response.json();

        const localTask = {

            id:
                `local-${Date.now()}`,

            title:
                descriptionInput.value.trim()

                    ? `${title} — ${descriptionInput.value.trim()}`

                    : title,

            completed: false,

            source: "Browser + API"

        };


        state.tasks.unshift(
            localTask
        );


        saveLocalTasks();


        form.reset();


        message.textContent =
            `Task "${created.title}" was created and saved locally.`;


        message.className =
            "message message-success";

    } catch (error) {

        message.textContent =
            error instanceof Error
                ? error.message
                : "Unable to save task.";


        message.className =
            "message message-error";


        message.setAttribute(
            "role",
            "alert"
        );

    } finally {

        submit.disabled = false;

    }

}


function renderDashboard() {

    const total =
        state.tasks.length;


    const completed =
        state.tasks.filter(
            task => task.completed
        ).length;


    const active =
        total - completed;


    const section =
        document.createElement("section");


    section.setAttribute(
        "aria-labelledby",
        "dashboard-heading"
    );


    const hero =
        document.createElement("div");


    hero.className =
        "hero";


    const eyebrow =
        document.createElement("p");


    eyebrow.className =
        "eyebrow";


    eyebrow.textContent =
        "Accessible task manager";


    const h1 =
        document.createElement("h1");


    h1.id =
        "dashboard-heading";


    h1.textContent =
        "Plan work without losing the basics.";


    const p =
        document.createElement("p");



    const actions =
        document.createElement("div");


    actions.className =
        "actions";


    const tasksLink =
        document.createElement("a");


    tasksLink.className =
        "button button-primary";


    tasksLink.href =
        "#tasks";


    tasksLink.textContent =
        "View tasks";


    const addLink =
        document.createElement("a");


    addLink.className =
        "button button-secondary";


    addLink.href =
        "#add";


    addLink.textContent =
        "Add a task";


    actions.append(
        tasksLink,
        addLink
    );


    hero.append(
        eyebrow,
        h1,
        p,
        actions
    );



    const grid =
        document.createElement("div");


    grid.className =
        "grid";


    [
        ["Total", total],
        ["Active", active],
        ["Completed", completed]

    ].forEach(
        ([label, value]) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "card";


            const number =
                document.createElement(
                    "p"
                );


            number.className =
                "stat-value";


            number.textContent =
                value;


            const text =
                document.createElement(
                    "p"
                );


            text.className =
                "stat-label";


            text.textContent =
                label;


            card.append(
                number,
                text
            );


            grid.append(card);

        }
    );


    section.append(
        hero,
        grid
    );


    app.replaceChildren(
        section
    );

}

function renderAdd() {

    const section =
        document.createElement("section");


    section.setAttribute(
        "aria-labelledby",
        "add-heading"
    );


    const hero =
        document.createElement("div");


    hero.className =
        "hero";


    const eyebrow =
        document.createElement("p");


    eyebrow.className =
        "eyebrow";


    eyebrow.textContent =
        "Create";


    const h1 =
        document.createElement("h1");


    h1.id =
        "add-heading";


    h1.textContent =
        "Add a task";


    const p =
        document.createElement("p");


    
    hero.append(
        eyebrow,
        h1,
        p
    );



    const form =
        document.createElement("form");


    form.className =
        "card form-card";


    form.noValidate = true;


    form.addEventListener(
        "submit",
        submitTask
    );

    const titleField =
        document.createElement("div");


    titleField.className =
        "form-field";


    const titleLabel =
        document.createElement("label");


    titleLabel.htmlFor =
        "title";


    titleLabel.textContent =
        "Task title";


    const title =
        document.createElement("input");


    title.id =
        "title";


    title.name =
        "title";


    title.required =
        true;


    title.maxLength =
        120;


    title.autocomplete =
        "off";


    title.placeholder =
        "e.g. Review accessibility audit";


    titleField.append(
        titleLabel,
        title
    );



    const descField =
        document.createElement("div");


    descField.className =
        "form-field";


    const descLabel =
        document.createElement("label");


    descLabel.htmlFor =
        "description";


    descLabel.textContent =
        "Description (optional)";


    const desc =
        document.createElement("textarea");


    desc.id =
        "description";


    desc.name =
        "description";


    desc.maxLength =
        180;


    desc.placeholder =
        "Add useful context…";


    descField.append(
        descLabel,
        desc
    );

    const message =
        document.createElement("div");


    message.dataset.formMessage =
        "true";


    message.setAttribute(
        "aria-live",
        "polite"
    );

    const actions =
        document.createElement("div");


    actions.className =
        "actions";


    const submit =
        document.createElement("button");


    submit.type =
        "submit";


    submit.className =
        "button-primary";


    submit.textContent =
        "Create task";


    const cancel =
        document.createElement("a");


    cancel.href =
        "#tasks";


    cancel.className =
        "button button-secondary";


    cancel.textContent =
        "Cancel";


    actions.append(
        submit,
        cancel
    );


    form.append(
        titleField,
        descField,
        message,
        actions
    );


    section.append(
        hero,
        form
    );


    app.replaceChildren(
        section
    );

}


function renderDemo() {

    const section =
        document.createElement("section");


    section.setAttribute(
        "aria-labelledby",
        "demo-heading"
    );


    const h1 =
        document.createElement("h1");


    h1.id =
        "demo-heading";


    h1.textContent =
        "State demonstration";


    const intro =
        document.createElement("p");

    const controls =
        document.createElement("div");


    controls.className =
        "card";


    const h2 =
        document.createElement("h2");


    h2.textContent =
        "Choose a state";


    const buttons =
        document.createElement("div");


    buttons.className =
        "demo-buttons";


    [
        ["loading", "Show loading"],
        ["empty", "Show empty"],
        ["error", "Show error"],
        ["success", "Show success"]

    ].forEach(
        ([type, label]) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "button-secondary";


            button.textContent =
                label;


            button.addEventListener(
                "click",
                () => showDemoState(type)
            );


            buttons.append(button);

        }
    );


    controls.append(
        h2,
        buttons
    );


    section.append(
        h1,
        intro,
        controls
    );


    app.replaceChildren(
        section
    );

}


function showDemoState(type) {

    const box =
        document.createElement("div");


    box.className =
        "card";


    const heading =
        document.createElement("h2");


    if (type === "loading") {

        heading.textContent =
            "Loading state";


        const text =
            document.createElement("p");


        text.textContent =
            "Loading tasks…";


        text.setAttribute(
            "role",
            "status"
        );


        box.append(
            heading,
            text
        );


        const skeleton =
            document.createElement("div");


        skeleton.className =
            "skeleton-list";


        skeleton.setAttribute(
            "aria-hidden",
            "true"
        );


        for (
            let i = 0;
            i < 3;
            i++
        ) {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "skeleton";


            skeleton.append(row);

        }


        box.append(skeleton);

    }

    else if (type === "empty") {

        heading.textContent =
            "Empty state";


        const text =
            document.createElement("p");


        text.textContent =
            "No tasks found. Try adding your first task.";


        box.className +=
            " message-empty";


        box.append(
            heading,
            text
        );

    }

    else if (type === "error") {

        heading.textContent =
            "Error state";


        const text =
            document.createElement("p");


        text.textContent =
            "We could not load tasks. Check your connection and try again.";


        const retry =
            document.createElement("button");


        retry.type =
            "button";


        retry.className =
            "button-primary";


        retry.textContent =
            "Retry";


        retry.addEventListener(
            "click",
            fetchTasks
        );


        box.className +=
            " message-error";


        box.append(
            heading,
            text,
            retry
        );

    }

    else {

        heading.textContent =
            "Success state";


        const text =
            document.createElement("p");


        text.textContent =
            "Tasks loaded successfully. Search and filter the list to continue.";


        box.className +=
            " message-success";


        const link =
            document.createElement("a");


        link.href =
            "#tasks";


        link.className =
            "button button-primary";


        link.textContent =
            "Open task list";


        box.append(
            heading,
            text,
            link
        );

    }


    app.replaceChildren(box);

}


/*
    ROUTER
*/

function renderRoute() {

    const route =
        window.location.hash
            .replace("#", "")
        || "dashboard";


    if (route === "tasks") {

        renderTasksView();


        if (
            state.tasks.length === 0
            &&
            state.status !== "loading"
        ) {

            fetchTasks();

        }


        return;

    }


    if (route === "add") {

        renderAdd();

        return;

    }


    if (route === "demo") {

        renderDemo();

        return;

    }


    renderDashboard();

}


/*
    Initial application startup
*/

state.tasks =
    loadLocalTasks();


renderRoute();


if (!state.tasks.length) {

    fetchTasks();

}