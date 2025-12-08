import React, { useMemo } from "react";
import { useEffect, useRef } from "react";

function WaterAmountSlider({ taskId,  completed, handleTaskToggle }) {
  const [value, setValue] = React.useState(0);
  const isInternalChangeRef = useRef(false);

  const handleChange = (e) => {
    const newValue = Number(e.target.value);
    setValue(newValue);
  };

  // Completed prop değiştiğinde value'yu güncelle (internal değişiklik)
  useEffect(() => {
    if (completed && value !== 500) {
      isInternalChangeRef.current = true;
      setValue(500);
     
    } 
  }, [completed, taskId]);

  // Value değiştiğinde task durumunu kontrol et (sadece kullanıcı değişikliklerinde)
  useEffect(() => {
    if (value === 500 && !completed && handleTaskToggle) {
      handleTaskToggle(taskId, false);
    }

    if (value === 0 && completed && handleTaskToggle) {
      handleTaskToggle(taskId, true);
    }
  }, [value]);

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
