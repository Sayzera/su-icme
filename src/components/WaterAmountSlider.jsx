import React, { useEffect } from "react";
import { useTask } from "../contexts/TaskContext";

function WaterAmountSlider({ taskId, completed, handleTaskToggle, taskDocId, amountOfWaterCosumed }) {

  // Başlangıç değerini completed'a göre ayarla (undefined kontrolü ile)
  const [value, setValue] = React.useState(completed ? (amountOfWaterCosumed ?? 500) : 0);
  const { amountOfWaterCosumedUpdate } = useTask();

  // Anlık UI güncellemesi (sürüklerken)
  const handleChange = (e) => {
    const newValue = Number(e.target.value);
    setValue(newValue);
  };

  // El çekilince kaydet
  const handleCommit = () => {
    if (taskDocId) {
      amountOfWaterCosumedUpdate(taskDocId, value);
    }

    // Task durumunu kontrol et
    if (value === 500 && !completed && handleTaskToggle) {
      handleTaskToggle(taskId, false);
    }
    if (value === 0 && completed && handleTaskToggle) {
      handleTaskToggle(taskId, true);
    }
  };

  // Dış kaynaklardan gelen değerleri sync et
  useEffect(() => {
    // Firestore'dan gelen değer varsa kullan
    if (amountOfWaterCosumed != null) {
      setValue(amountOfWaterCosumed);
    }
  }, [amountOfWaterCosumed]);

  return (
    <div
      style={{
        width: "100%",
        marginBottom: "16px",
      }}
    >
      <label
        htmlFor={`ml-slider-${taskId}`}
        style={{
          display: "block",
          marginBottom: "6px",
          fontWeight: "bold",
          fontSize: "15px",
          color: "#2589fd",
        }}
      >
        Kaç ml su içtin?
        <span
          style={{
            background: "#e3f7fa",
            color: "#1282a2",
            marginLeft: "10px",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "15px",
            border: "1px solid #b7e0ea",
          }}
        >
          {value} ml
        </span>
      </label>
      <div
        style={{
          width: "100%",
          background: "#f0f6ff",
          borderRadius: "12px",
          height: "34px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          boxShadow: "0 1px 4px #dff3fd5b",
          padding: "0 8px",
        }}
      >
        <input
          id={`ml-slider-${taskId}`}
          type="range"
          min={0}
          max={500}
          value={value}
          onChange={handleChange}
          onMouseUp={handleCommit}
          onTouchEnd={handleCommit}
          style={{
            width: "95%",
            accentColor: "#38b6ff",
            height: "6px",
            borderRadius: "5px",
            background: `linear-gradient(90deg, #38b6ff ${
              value / 5
            }%, #e3e3e3 ${value / 5}%)`,
            verticalAlign: "middle",
            outline: "none",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "13px",
          color: "#5b5b5b",
          marginTop: "3px",
        }}
      >
        <span>0 ml</span>
        <span>500 ml</span>
      </div>
    </div>
  );
}

export default WaterAmountSlider;
