import React from "react";
import TaskCardItem from "./TaskCardItem";

function TaskCard({ todayTasks, handleTaskToggle }) {


  return (
    <div className="tasks-grid">
      {todayTasks.map((task) => (
        <TaskCardItem key={task.id} task={task} handleTaskToggle={handleTaskToggle} taskDocId={task.taskId} />

      ))}
    </div>
  );
}

export default TaskCard;
