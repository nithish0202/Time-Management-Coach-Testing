import Grid from '../Grid/Grid';
import { useState, useEffect, useMemo } from 'react';
import Button from '@mui/material/Button';
import { IoAddOutline } from "react-icons/io5";
import Switch from '@mui/material/Switch';
import { toast } from 'react-toastify';
import EditPriorityTags from '../TaskForm/EditPriorityTags';
import TaskForm from '../TaskForm/TaskForm';
import { MdFilterList } from 'react-icons/md';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import Chip from '@mui/material/Chip';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './FourQuadrants.css';
import BACKEND_URL from '../../../Config';
import FocusSummary from '../FourQuadrants/FocusSummary'; 

const label = { inputProps: { 'aria-label': 'Size switch demo' } };

function FourQuadrants({ tasks, setTask, setHideTable = () => {}, setQtasks = () => {} }) {
  const color = ["#2196F3", "#F44336", "#000000", "#FF9800"];
  const [gridData, setGridData] = useState([]);
  const [open, setOpen] = useState(false);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [editTask, setEditTask] = useState(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [preFocusGridCount, setPreFocusGridCount] = useState({});
  const [openTagEditor, setOpenTagEditor] = useState(false);
  const [taskToTagEdit, setTaskToTagEdit] = useState(null);
  const [completedDuringFocus, setCompletedDuringFocus] = useState([]);
  const [globalFilters, setGlobalFilters] = useState({
    complexity: [],
    type: [],
    category: [],
    impact: []
  });
  const [showGlobalFilters, setShowGlobalFilters] = useState(false);
  const navigate = useNavigate();
  const activeTasks = useMemo(() => tasks.filter(task => task.status !== 'completed'), [tasks]);

  // Save or update task
  const saveTaskToBackend = async (task, isEdit) => {
    const method = isEdit ? 'put' : 'post';
    const url = isEdit
      ? `${BACKEND_URL}/api/tasks/${task.id}`
      : `${BACKEND_URL}/api/tasks`;

    const res = await axios[method](url, task, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    return res.data;
  };

  // Handle saving task (create or update)
 const handleTaskSave = async (task) => {
  try {
    const strategicTags = ['Strategic Work', 'Deadline', 'Project Delivery Work'];
    const selectedTypeTags = task.priority_tags?.type || [];

    const hasStrategicTag = selectedTypeTags.some(tag =>
      strategicTags.includes(tag)
    );

    if (hasStrategicTag && task.priority !== 'high') {
      task.priority = 'high';
    }
     if (editTask && !task.priority_tags) {
      task.priority_tags = editTask.priority_tags;
    }

    const savedTask = await saveTaskToBackend(task, !!editTask);

    if (editTask) {
      setTask(prev => prev.map(t => t.id === savedTask.id ? savedTask : t));
      toast.success("Task updated");
    } else {
      setTask(prev => [...prev, savedTask]);
      toast.success("Task created");
    }

    setEditTask(null);
    setOpen(false);
  } catch (error) {
    console.error("Failed to save task", error);
    toast.error("Something went wrong");
  }
};


 const handleTagSave = async (updatedTags) => {
  try {
    const updatedTask = { ...taskToTagEdit, priority_tags: updatedTags };

    // Check if any strategic tag is present
    const strategicTags = ['Strategic Work', 'Deadline', 'Project Delivery Work'];
    const selectedTypeTags = updatedTags.type || [];

    const hasStrategicTag = selectedTypeTags.some(tag =>
      strategicTags.includes(tag)
    );

    if (hasStrategicTag) {
      updatedTask.priority = 'high';
    }

    const savedTask = await saveTaskToBackend(updatedTask, true);

    setTask(prev =>
      prev.map(t => t.id === savedTask.id ? savedTask : t)
    );

    toast.success("Tags saved");
    setTaskToTagEdit(null);
    setOpenTagEditor(false);
  } catch (error) {
    console.error("Error saving task", error);
    toast.error("Failed to save task");
  }
};


useEffect(() => {
  const saved = localStorage.getItem("focusMode");
  if (saved) {
    const { isFocusMode, startTime, completedTasks } = JSON.parse(saved);
    if (isFocusMode) {
      setIsFocusMode(true);
      setStartTime(startTime);
      // sync state with localStorage
      setCompletedDuringFocus(completedTasks || []);
    }
  }
}, []);

useEffect(() => {
  const categorizeTasksByPriority = (taskList) => {
    const impUrgentGrid = [];
    const impNotUrgentGrid = [];
    const notImpUrgentGrid = [];
    const notImpNotUrgentGrid = [];

    const today = new Date();
    const offsetToday = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);
    const todayDate = offsetToday.toISOString().split("T")[0];

    let weekLastDate = new Date(offsetToday);
    weekLastDate.setDate(weekLastDate.getDate() + 5);
    weekLastDate = weekLastDate.toISOString().split("T")[0];

    const strategicTags = ['strategic work', 'deadline', 'project delivery work'];

    for (let single of taskList) {
      if (single.status === "completed") continue;

      // Normalize tags for checking
      const taskTags = (single.tags || []).map(t => t.toLowerCase());

      // Automatically mark as important if any strategic tag exists
      const hasStrategicTag = strategicTags.some(tag => taskTags.includes(tag));
      if (hasStrategicTag && single.priority !== 'high') {
        single.priority = 'high';
      }

      const dueDate = single.due_date ? new Date(single.due_date).toISOString().split("T")[0] : null;
      const createdAt = single.created_at ? new Date(single.created_at).toISOString().split("T")[0] : null;

      // No due date → Not Important & Not Urgent
      if (!dueDate) {
        notImpNotUrgentGrid.push(single);
        continue;
      }

      // Overdue high-priority → Important & Urgent
      if (dueDate < todayDate && single.priority === "high") {
        single.suggestion = "overdueTask";
        impUrgentGrid.push(single);
      }
      // Due today & high-priority → Important & Urgent
      else if (dueDate === todayDate && single.priority === "high") {
        impUrgentGrid.push(single);
      }
      // Due this week & normal/high → Important & Not Urgent
      else if (
        dueDate > todayDate &&
        dueDate <= weekLastDate &&
        (single.priority === "high" || single.priority === "normal")
      ) {
        impNotUrgentGrid.push(single);
      }
      // Created and due today → Not Important & Urgent
      else if (createdAt === todayDate && dueDate === todayDate) {
        notImpUrgentGrid.push(single);
      }
      // Everything else → Not Important & Not Urgent
      else {
        notImpNotUrgentGrid.push(single);
      }
    }

    const updatedTask = [
      { title: "Important & Not Urgent", list: impNotUrgentGrid },
      { title: "Important & Urgent", list: impUrgentGrid },
      { title: "Not Important & Not Urgent", list: notImpNotUrgentGrid },
      { title: "Not Important & Urgent", list: notImpUrgentGrid }
    ];

    setGridData(updatedTask);
  };

  categorizeTasksByPriority(activeTasks);
}, [tasks]);


  const globalAvailableFilters = useMemo(() => {
    const tagCounts = { complexity: {}, type: {}, category: {}, impact: {} };

    activeTasks.forEach(task => {
      if (task.priority_tags) {
        Object.keys(tagCounts).forEach(group => {
          if (task.priority_tags[group]) {
            task.priority_tags[group].forEach(tag => {
              tagCounts[group][tag] = (tagCounts[group][tag] || 0) + 1;
            });
          }
        });
      }
    });

    const filters = {};
    Object.keys(tagCounts).forEach(group => {
      filters[group] = Object.keys(tagCounts[group]).filter(tag => tagCounts[group][tag] > 0);
    });

    return filters;
  }, [activeTasks]);

  const toggleGlobalFilter = (group, tag) => {
    setGlobalFilters(prev => ({
      ...prev,
      [group]: prev[group].includes(tag)
        ? prev[group].filter(f => f !== tag)
        : [...prev[group], tag]
    }));
  };

  const clearAllGlobalFilters = () => {
    setGlobalFilters({ complexity: [], type: [], category: [], impact: [] });
  };

  const hasActiveGlobalFilters = Object.values(globalFilters).some(arr => arr.length > 0);

  const handleEditTask = (task) => {
    setEditTask(task);
    setOpen(true);
  };
const markTaskAsCompleted = (taskId) => {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  let saved = JSON.parse(localStorage.getItem("focusMode"));

  const completedTask = {
    ...task,
    status: 'completed',
    completed_at: new Date().toISOString(),
  };

  if (saved?.isFocusMode) {
    saved.completedTasks = saved.completedTasks || [];

    const existingIndex = saved.completedTasks.findIndex(t => t.id === task.id);

    if (existingIndex !== -1) {
      // Update existing entry
      saved.completedTasks[existingIndex] = completedTask;
    } else {
      // Add new completed task
      saved.completedTasks.push(completedTask);
    }

    localStorage.setItem("focusMode", JSON.stringify(saved));
    setCompletedDuringFocus(saved.completedTasks);
  }

  const updatedTasks = tasks.map(t =>
    t.id === taskId ? { ...t, status: 'completed' } : t
  );
  setTask(updatedTasks);

  axios.put(`${BACKEND_URL}/api/tasks/${taskId}`, {
    ...task,
    status: 'completed'
  }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  }).catch(err => {
    console.error("Failed to update task on server", err);
  });
};




  const handleTagEdit = (task) => {
    console.log("Edit task clicked:", task.id);
    navigate(`/edit-tags/${task.id}`);
  };

  const handleQtaskSave = (task) => {
    try {
      if (setQtasks) {
        setQtasks(prev => [...prev, task]);
      }
    } catch (error) {
      console.error("Error saving Time Log:", error);
    }
  };

  const handleSwitchChange = (event) => {
    setSwitchChecked(event.target.checked);
    setHideTable(event.target.checked);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

const startFocusMode = () => {
  const focusModeData = {
    isFocusMode: true,
    startTime: Date.now(),
    completedTasks: []
  };

  localStorage.setItem("focusMode", JSON.stringify(focusModeData));
  setIsFocusMode(true);
  navigate('/home');
};

const endFocusMode = async () => {
  if (!isFocusMode) {
    console.warn("Not in focus mode — nothing to send");
    return;
  }

  const endTime = Date.now();
  const timeSpent = Math.floor((endTime - startTime) / 1000);

  const savedFocusRaw = localStorage.getItem("focusMode");
  console.log("Focus mode data at endFocusMode:", savedFocusRaw);

  let savedFocus = null;
  try {
    savedFocus = savedFocusRaw ? JSON.parse(savedFocusRaw) : null;
  } catch (e) {
    console.error("Error parsing focusMode from localStorage", e);
  }

  const completedTasks = (savedFocus?.completedTasks || [])
    .filter(task => task.status === 'completed')
    .map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      completed_at: task.completed_at || new Date().toISOString()
    }));

  if (completedTasks.length === 0) {
    alert("No tasks were completed during focus mode — nothing to save.");
    localStorage.removeItem("focusMode");
    setIsFocusMode(false);
    setCompletedDuringFocus([]);
    navigate('/login');
    return;
  }

  const sessionSummary = {
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    timeSpent,
    completedTasks
  };

  console.log("Sending focus session to backend:", sessionSummary);

  try {
    await axios.post(`${BACKEND_URL}/api/focus`, sessionSummary, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Failed to save focus session to backend", error);
  }

  localStorage.removeItem("focusMode");
  setIsFocusMode(false);
  setCompletedDuringFocus([]);
  navigate('/login');
};





  return (
    <>
      <div>
        <div style={{ marginBottom: '20px' }}>
          <div>
            <Button variant="contained" style={{ fontWeight: "bolder", marginLeft: 15 }} onClick={() => setOpen(true)}>
              <IoAddOutline /> Add Task
            </Button>
            <Button variant="outlined" style={{ fontWeight: "bold", marginLeft: 10 }} onClick={startFocusMode}>
              Focus Mode
            </Button>
            {isFocusMode && (
              <Button variant="contained" color="error" style={{ fontWeight: "bold", marginLeft: 10 }} onClick={endFocusMode}>
                Exit Focus Mode
              </Button>
            )}
               <Button
      variant="contained"
      style={{ fontWeight: "bold", marginLeft: 10 }}
      onClick={() => navigate("/focus-summary")}
    >
      View Focus Summary
    </Button>
          </div>
          <div style={{ marginTop: '12px' }}>
            <Link to="/time-log" style={{ textDecoration: 'none' }}>
              <Button variant="contained" color="primary" style={{ fontWeight: "bolder", marginLeft: 15 }}>
                <IoAddOutline /> Add Time Log
              </Button>
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 15 }}>
          <label htmlFor="toggleSwitch" name="toggle">Toggle to show table</label>
          <Switch {...label} checked={switchChecked} onChange={handleSwitchChange} size="medium" id='toggleSwitch' name="toggle" />
        </div>
      </div>

      <div className='gird-content'>
        <p>Aim to focus on Important and Not Urgent tasks to avoid these becoming urgent. This is a key trait of highly productive people</p>
        <p>Reprioritize your tasks by changing due dates or priority to focus on what matters most.</p>
      </div>

      {Object.values(globalAvailableFilters).some(arr => arr.length > 0) && (
        <div style={{ margin: '20px 15px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
          <div
            onClick={() => setShowGlobalFilters(!showGlobalFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '12px 16px',
              borderBottom: showGlobalFilters ? '1px solid #e0e0e0' : 'none'
            }}
          >
            {showGlobalFilters ? <FaChevronDown style={{ marginRight: '8px', color: '#2196F3' }} /> : <FaChevronRight style={{ marginRight: '8px', color: '#2196F3' }} />}
            <MdFilterList style={{ marginRight: '8px', color: '#2196F3' }} />
            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>
              Filter All Quadrants {hasActiveGlobalFilters && `(${Object.values(globalFilters).flat().length} active)`}
            </span>
            {hasActiveGlobalFilters && (
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAllGlobalFilters();
                }}
                style={{ marginLeft: 'auto', fontSize: '0.8rem', minWidth: 'auto', padding: '4px 12px' }}
              >
                Clear All Filters
              </Button>
            )}
          </div>

          {showGlobalFilters && (
            <div style={{ padding: '16px' }}>
              {Object.entries(globalAvailableFilters).map(([group, tags]) =>
                tags.length > 0 && (
                  <div key={group} style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#555', marginRight: '12px', display: 'inline-block', minWidth: '80px' }}>
                      {group.charAt(0).toUpperCase() + group.slice(1)}:
                    </span>
                    <div style={{ display: 'inline-block' }}>
                      {tags.map(tag => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          onClick={() => toggleGlobalFilter(group, tag)}
                          style={{
                            margin: '2px 4px',
                            fontSize: '0.75rem',
                            backgroundColor: globalFilters[group].includes(tag) ? '#2196F3' : '#e0e0e0',
                            color: globalFilters[group].includes(tag) ? 'white' : '#333',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {gridData.map((grid, index) => (
         <Grid
  key={index}
  title={grid.title}
  taskList={grid.list}
  color={color}
  colorIndex={index}
  isFocusMode={isFocusMode}
  onEditTask={handleEditTask}
  onEditPriorityTags={handleTagEdit}
  globalFilters={globalFilters}
  onMarkComplete={markTaskAsCompleted}
/>

        ))}
      </div>

      <TaskForm
        open={open}
        onSave={handleTaskSave}
        onClose={() => {
          setOpen(false);
          setEditTask(null);
        }}
        isUpdate={!!editTask}
        editTask={editTask}
        setTask={setTask}
      />

      <EditPriorityTags
        open={openTagEditor}
        onClose={() => setOpenTagEditor(false)}
        task={taskToTagEdit}
        onSave={handleTagSave}
        onEditPriorityTags={handleTagEdit}
      />
    </>
  );
}

export default FourQuadrants;
