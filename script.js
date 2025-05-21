document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');

    // Load tasks from local storage
    loadTasks();

    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            addTask();
        }
    });

    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') {
            alert('Please enter a task!');
            return;
        }

        createTaskElement(taskText, false);
        taskInput.value = '';
        saveTasks();
    }

    function createTaskElement(text, isCompleted) {
        const li = document.createElement('li');
        
        const taskSpan = document.createElement('span');
        taskSpan.textContent = text;
        taskSpan.classList.add('task-text');
        if (isCompleted) {
            li.classList.add('completed');
        }
        taskSpan.addEventListener('click', () => {
            li.classList.toggle('completed');
            saveTasks();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', () => {
            taskList.removeChild(li);
            saveTasks();
        });

        li.appendChild(taskSpan);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    }

    function saveTasks() {
        const tasks = [];
        taskList.querySelectorAll('li').forEach(li => {
            tasks.push({
                text: li.querySelector('.task-text').textContent,
                completed: li.classList.contains('completed')
            });
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            const tasks = JSON.parse(storedTasks);
            tasks.forEach(task => {
                createTaskElement(task.text, task.completed);
            });
        }
    }
});