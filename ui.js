const categoryDialog = document.querySelector('#categoryDialog');
const categoryForm = categoryDialog.querySelector("form");
const closeCategoryDialog = categoryDialog.querySelector('button[type="button"]');
const addCategoryBtn = document.querySelector("#addCategoryBtn");

const taskDialog = document.querySelector('#taskDialog');
const taskForm = taskDialog.querySelector("form");
const closeTaskDialog = taskDialog.querySelector('button[type="button"]');
const addTaskBtn = document.querySelector("#addTaskBtn");

const categoriesListEl = document.querySelector("#categories");
const taskTmpl = document.querySelector("#taskTempl").content;
const tasksList = document.querySelector("#tasks");

document.querySelectorAll(".menuIcon").forEach(b=>b.addEventListener("click", toggleAside));

let selectedCategory;

function toggleDialog(dialog) {
    if (dialog.open) {
        dialog.close();
    }
    else {
        dialog.showModal();
    }
}

function toggleAside(){
    const aside = document.querySelector("aside");
    aside.style.display = aside.style.display === "none" ? "" : "none";
}

function categoryItem(category) {
    const li = document.createElement("li");
    li.classList.add("category");
    li.id = category.id;
    li.innerText = category.name;
    li.addEventListener("click", () => {
        categoriesListEl.querySelectorAll('li').forEach(l=>l.classList.remove("active"))
        li.classList.add("active")
        readOne(`/categories/${category.id}?_embed=tasks`, category.id).then(selectCategory);
    });
    return li;
}

function taskItem(task) {

    const taskStatus = {
        pending: "Mark as done",
        complete: "Copy",
        overdue: "Reset"
    }

    const item = taskTmpl.cloneNode(true).querySelector(".task-card");
    const taskIndex = selectedCategory.tasks.findIndex(t => task.id === t.id);

    item.classList.add(`${task.status}-task`);
    item.querySelector("h4").innerText = task.title;
    item.querySelector("p").innerText = task.description;
    item.querySelector(".deadline").innerText = task.deadline;
    item.querySelector(".delete-task-btn").addEventListener("click", (evt) => {
        item.remove();
        _delete("/tasks", task.id);
        if (taskIndex > -1) {
            selectedCategory.tasks.splice(taskIndex, 1);
            selectCategory(selectedCategory);
        }
    });
    const markTaskBtn = item.querySelector(".mark-task-btn");
    markTaskBtn.innerText = taskStatus[task.status];
    markTaskBtn.addEventListener("click", () => {
        update("/tasks", task.id, { status: "complete" }).then((updatedTask) => {
            task.status = updatedTask.status;
            selectedCategory.tasks[taskIndex] = task;
            selectCategory(selectedCategory);
        });
    });
    return item;
}

function loadCategories() {
    readAll("/categories").then(categories => {
        categories.forEach(category => {
            categoriesListEl.appendChild(categoryItem(category));
        });

        if (categories.length > 0 && !selectedCategory) {
            selectCategory(categories[0]);
            readAll("/tasks?categoryId=" + selectedCategory.id).then(loadTasks);
        }
    });
}

function loadTasks(tasks) {
    tasksList.querySelectorAll(".task-card").forEach(tc => tc.remove());
    tasks.forEach(task => {
        tasksList.appendChild(taskItem(task));
    });
}

function selectCategory(category) {
    console.log(category)
    if (!category) return;
    selectedCategory = category;
    const mainTitle = document.querySelector("header h3");
    mainTitle.innerText = category.name;
    if (category.tasks) loadTasks(category.tasks);
    sessionStorage.setItem("selecctedCategory", JSON.stringify(selectedCategory))
}

loadCategories();
if (sessionStorage.getItem("selecctedCategory")) {
    selectCategory(JSON.parse(sessionStorage.getItem("selecctedCategory")));
}

closeCategoryDialog.addEventListener("click", () => toggleDialog(categoryDialog));
addCategoryBtn.addEventListener("click", () => toggleDialog(categoryDialog));
closeTaskDialog.addEventListener("click", () => toggleDialog(taskDialog));
addTaskBtn.addEventListener("click", () => toggleDialog(taskDialog));

categoryForm.addEventListener("submit", (evt) => {
    evt.preventDefault();

    const categoryName = categoryForm.name.value;
    const banner = categoryForm.banner.value;
    const category = Category(categoryName, banner);

    create('/categories', category).then(newCategory => {
        category.id = newCategory.id;
        categoriesListEl.appendChild(categoryItem(category));
        categoryForm.reset();
        closeCategoryDialog.click();
        selectCategory(newCategory);
    });

});

taskForm.addEventListener("submit", evt => {
    evt.preventDefault();
    if (!selectedCategory) {
        console.log("No category selected")
        return;
    }
    const task = Task(taskForm.title.value, taskForm.description.value, taskForm.deadline.value, selectedCategory.id);

    create("/tasks", task).then(newTask => {
        task.id = newTask;
        tasksList.appendChild(taskItem(task));
        taskForm.reset();
        toggleDialog(taskDialog);
        selectedCategory.tasks.push(newTask);
        selectCategory(selectedCategory);
    })
});

if(window.innerWidth <= 570){
    document.querySelector("aside").style.display = "none";
}