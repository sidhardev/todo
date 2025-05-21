document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const taskDueDate = document.getElementById('taskDueDate');
    const taskPriority = document.getElementById('taskPriority');
    const taskTags = document.getElementById('taskTags');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const filterStatus = document.getElementById('filterStatus');
    const sortBy = document.getElementById('sortBy');
    const filterTags = document.getElementById('filterTags');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const statsArea = {
        total: document.getElementById('totalTasks'),
        completed: document.getElementById('completedTasks'),
        pending: document.getElementById('pendingTasks')
    };

    // Set today as the minimum date for the due date input
    const today = new Date().toISOString().split('T')[0];
    taskDueDate.min = today;
    taskDueDate.value = today;

    // Load tasks from local storage
    loadTasks();
    updateStats();

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
    filterStatus.addEventListener('change', filterAndSortTasks);
    sortBy.addEventListener('change', filterAndSortTasks);
    filterTags.addEventListener('input', filterAndSortTasks);
    clearCompletedBtn.addEventListener('click', clearCompleted);

    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') {
            alert('Please enter a task!');
            return;
        }

        const task = {
            text: taskText,
            completed: false,
            dueDate: taskDueDate.value,
            priority: taskPriority.value,
            tags: taskTags.value.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
            addedDate: new Date().toISOString()
        };

        const li = createTaskElement(task);
        li.dataset.addedDate = task.addedDate; // Store the added date
        
        // Reset inputs
        taskInput.value = '';
        taskDueDate.value = today;
        taskPriority.value = 'medium';
        taskTags.value = '';
        
        saveTasks();
        updateStats();
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.classList.add(`priority-${task.priority}`);
        
        const taskContent = document.createElement('div');
        taskContent.style.flex = '1';

        const taskSpan = document.createElement('span');
        taskSpan.textContent = task.text;
        taskSpan.classList.add('task-text');
        
        const taskMeta = document.createElement('div');
        taskMeta.classList.add('task-meta');
        
        // Add due date with warning if close/overdue
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const dueDateSpan = document.createElement('span');
        dueDateSpan.textContent = `Due: ${task.dueDate}`;
        if (daysDiff <= 2 && !task.completed) {
            dueDateSpan.classList.add('due-date-warning');
        }
        taskMeta.appendChild(dueDateSpan);

        // Add tags
        // Safely handle tags
        if (Array.isArray(task.tags)) {
            task.tags.forEach(tag => {
                if (tag) {  // Check if tag is not null/undefined/empty
                    const tagSpan = document.createElement('span');
                    tagSpan.textContent = tag;
                    tagSpan.classList.add('task-tag');
                    taskMeta.appendChild(tagSpan);
                }
            });
        }

        if (task.completed) {
            li.classList.add('completed');
        }

        taskContent.appendChild(taskSpan);
        taskContent.appendChild(taskMeta);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-btn');

        // Event Listeners
        taskSpan.addEventListener('click', () => {
            li.classList.toggle('completed');
            saveTasks();
            updateStats();
        });

        deleteBtn.addEventListener('click', () => {
            li.remove();
            saveTasks();
            updateStats();
        });

        li.appendChild(taskContent);
        li.appendChild(deleteBtn);
        taskList.appendChild(li);
        return li; // Return the created element
    }

    function saveTasks() {
        const tasks = [];
        taskList.querySelectorAll('li').forEach(li => {
            const task = {
                text: li.querySelector('.task-text').textContent,
                completed: li.classList.contains('completed'),
                dueDate: li.querySelector('.task-meta span').textContent.replace('Due: ', ''),
                priority: Array.from(li.classList).find(cls => cls.startsWith('priority-')).replace('priority-', ''),
                tags: Array.from(li.querySelectorAll('.task-tag')).map(tag => tag.textContent).filter(tag => tag),
                addedDate: li.dataset.addedDate || new Date().toISOString()
            };
            tasks.push(task);
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function loadTasks() {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            const tasks = JSON.parse(storedTasks);
            tasks.forEach(task => createTaskElement(task));
        }
    }

    function filterAndSortTasks() {
        const status = filterStatus.value;
        const sort = sortBy.value;
        const tags = filterTags.value.toLowerCase().split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        const tasks = Array.from(taskList.children);
        
        // Hide all tasks first
        tasks.forEach(task => task.style.display = 'none');

        // Filter tasks
        const filteredTasks = tasks.filter(task => {
            const isCompleted = task.classList.contains('completed');
            const taskTags = Array.from(task.querySelectorAll('.task-tag')).map(tag => tag.textContent.toLowerCase());
            
            const matchesStatus = status === 'all' || 
                (status === 'completed' && isCompleted) || 
                (status === 'active' && !isCompleted);

            const matchesTags = tags.length === 0 || 
                tags.some(tag => taskTags.includes(tag));

            return matchesStatus && matchesTags;
        });

        // Sort tasks
        filteredTasks.sort((a, b) => {
            switch(sort) {
                case 'dueDate':
                    const dateA = new Date(a.querySelector('.task-meta span').textContent.replace('Due: ', ''));
                    const dateB = new Date(b.querySelector('.task-meta span').textContent.replace('Due: ', ''));
                    return dateA - dateB;
                case 'priority':
                    const priorities = { high: 3, medium: 2, low: 1 };
                    const priorityA = a.classList.toString().match(/priority-(\w+)/)[1];
                    const priorityB = b.classList.toString().match(/priority-(\w+)/)[1];
                    return priorities[priorityB] - priorities[priorityA];
                case 'added':
                    return new Date(a.dataset.addedDate) - new Date(b.dataset.addedDate);
            }
        });

        // Show filtered and sorted tasks
        filteredTasks.forEach(task => {
            task.style.display = 'flex';
        });
    }

    function updateStats() {
        const total = taskList.children.length;
        const completed = taskList.querySelectorAll('.completed').length;
        
        statsArea.total.textContent = `Total: ${total}`;
        statsArea.completed.textContent = `Completed: ${completed}`;
        statsArea.pending.textContent = `Pending: ${total - completed}`;
    }

    function clearCompleted() {
        const completedTasks = taskList.querySelectorAll('.completed');
        completedTasks.forEach(task => task.remove());
        saveTasks();
        updateStats();
    }
});