import { ROBOT_COLORS } from "../../services/robotColors.js";
import styles from "../../scenes/scenes.module.css";

export default function ColorPicker({ value, onChange }) {
  return (
    <div className={styles.swatchRow}>
      {ROBOT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Robot color ${c}`}
          className={`${styles.swatch} ${value === c ? styles.swatchActive : ""}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  );
}
