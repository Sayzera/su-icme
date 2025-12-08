import { useState } from "react";
import WaterAmountSlider from "./WaterAmountSlider";

function TaskCardItem({ task, handleTaskToggle, taskDocId }) {


  return (
    <div className={`task-card ${task.completed ? "completed" : ""}`}>
      <WaterAmountSlider
        taskId={task.id}
        completed={task.completed}
        amountOfWaterCosumed={task.amountOfWaterCosumed}
        handleTaskToggle={handleTaskToggle}
        taskDocId={taskDocId}
      />

      <div className="task-header">
        <h3>{task.label}</h3>
        <div
          className={`task-status ${task.completed ? "completed" : "pending"}`}
        >
          {task.completed ? "✓ Tamamlandı" : "⏳ Bekliyor"}
        </div>
      </div>

      {task.completed && task.completedAt && (
        <p className="completed-time">
          Tamamlanma:{" "}
          {task.completedAt?.toDate
            ? new Date(task.completedAt.toDate()).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : task.completedAt
            ? new Date(task.completedAt).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </p>
      )}

      <button
        onClick={() => handleTaskToggle(task.id, task.completed)}
        className={`task-button ${task.completed ? "uncomplete" : "complete"}`}
      >
        {task.completed ? "Geri Al" : "Tamamla"}
      </button>
    </div>
  );
}

export default TaskCardItem;
