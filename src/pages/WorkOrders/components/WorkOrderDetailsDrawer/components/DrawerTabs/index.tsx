import type { DrawerTab, DrawerTabConfig } from "../../constants";
import styles from "../../styles.module.css";

type DrawerTabsProps = {
  tabs: DrawerTabConfig[];
  activeTab: DrawerTab;
  onTabChange: (tab: DrawerTab) => void;
};

export function DrawerTabs({ tabs, activeTab, onTabChange }: DrawerTabsProps) {
  return (
    <nav className={styles.tabs} aria-label="Seções da OS">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={activeTab === tab.id ? styles.activeTab : styles.tab}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
