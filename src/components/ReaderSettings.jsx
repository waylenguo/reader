import React from 'react'
import { THEMES } from '../config/themes'
import './ReaderSettings.css'

const ReaderSettings = ({
    fontSize,
    adjustFontSize,
    brightness,
    handleBrightnessChange,
    theme,
    handleThemeChange,
    isDoublePage,
    handlePageLayoutChange
}) => {
    return (
        <div className="settings-panel">
            <div className="settings-group">
                <label>字号</label>
                <div className="settings-controls">
                    <button onClick={() => adjustFontSize(-10)}>缩小</button>
                    <span>{fontSize}%</span>
                    <button onClick={() => adjustFontSize(10)}>放大</button>
                </div>
            </div>

            <div className="settings-group">
                <label>亮度</label>
                <div className="settings-controls">
                    <input 
                        type="range" 
                        min="20" 
                        max="100"
                        value={brightness}
                        onChange={(e) => handleBrightnessChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="settings-group">
                <label>背景</label>
                <div className="theme-buttons">
                    {Object.entries(THEMES).map(([key, value]) => (
                        <button 
                            key={key}
                            className={`theme-button ${key} ${theme === key ? 'active' : ''}`}
                            onClick={() => handleThemeChange(key)}
                            title={value.name}
                        ></button>
                    ))}
                </div>
            </div>

            <div className="settings-group">
                <label>页面模式</label>
                <div className="settings-controls">
                    <button 
                        className={!isDoublePage ? 'active' : ''}
                        onClick={() => handlePageLayoutChange(false)}
                    >
                        单页
                    </button>
                    <button 
                        className={isDoublePage ? 'active' : ''}
                        onClick={() => handlePageLayoutChange(true)}
                    >
                        双页
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ReaderSettings 