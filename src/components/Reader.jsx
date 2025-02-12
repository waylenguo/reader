import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ePub from 'epubjs'
import './Reader.css'
import { LeftOutlined, UnorderedListOutlined, FontSizeOutlined } from '@ant-design/icons'

function Reader() {
    const { bookId } = useParams()
    const viewerRef = useRef(null)
    const [rendition, setRendition] = useState(null)
    const [book, setBook] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [isResizing, setIsResizing] = useState(false)
    const originalResizeHandlerRef = useRef(null)
    const [showToc, setShowToc] = useState(false)
    const [toc, setToc] = useState([])
    const navigate = useNavigate()
    const [fontSize, setFontSize] = useState(100)
    const [showSettings, setShowSettings] = useState(false)
    const [brightness, setBrightness] = useState(100)
    const [theme, setTheme] = useState('white')
    const [isDoublePage, setIsDoublePage] = useState(false)
    const [currentTheme, setCurrentTheme] = useState({
        backgroundColor: '#ffffff',
        textColor: '#000000'
    });

    // 从 URL 路径中获取书名并去掉后缀
    const getBookNameFromPath = () => {
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length <= 2) return '未知书名';
        
        const encodedName = pathParts[pathParts.length - 1];
        const fullName = decodeURIComponent(encodedName);
        
        // 去掉文件后缀（如 .epub）
        return fullName.replace(/\.[^/.]+$/, '');
    };

    // 重新计算页数的函数
    const recalculatePages = async (bookInstance, renditionInstance) => {
        if (!bookInstance || !renditionInstance) return

        try {
            // 重新设置尺寸
            renditionInstance.settings.width = window.innerWidth
            renditionInstance.settings.height = window.innerHeight

            // 刷新显示
            await renditionInstance.display()

            // 等待内容加载完成
            await new Promise(resolve => setTimeout(resolve, 100))

            // 生成位置信息
            await bookInstance.ready
            const locations = await bookInstance.locations.generate()

            // 获取总页数
            // const total = bookInstance.locations.length()
            setTotalPages(locations.length)

            // 更新当前页码
            const currentLocation = renditionInstance.currentLocation()
            if (currentLocation) {
                const locationIndex = bookInstance.locations.locationFromCfi(currentLocation.start.cfi)
                setCurrentPage(locationIndex + 1)
            }

        } catch (error) {
            console.error('Error recalculating pages:', error)
        }
    }

    // 调整字体大小
    const adjustFontSize = (increment) => {
        setFontSize(prevSize => {
            const newSize = prevSize + increment;
            return Math.min(Math.max(newSize, 60), 200);
        });
    };

    // 调整亮度
    const handleBrightnessChange = (value) => {
        const newBrightness = parseInt(value);
        setBrightness(newBrightness);
        document.documentElement.style.filter = `brightness(${newBrightness / 100})`;
    };

    // 在组件加载时设置初始亮度
    useEffect(() => {
        document.documentElement.style.filter = 'brightness(1)';
    }, []);

    // 初始化时设置默认样式
    useEffect(() => {
        if (rendition) {
            // 设置默认样式
            rendition.hooks.content.register(contents => {
                const styles = `
                    body {
                        background-color: ${currentTheme.backgroundColor} !important;
                        color: ${currentTheme.textColor} !important;
                        transition: background-color 0.2s, color 0.2s;
                    }
                    * {
                        background-color: transparent !important;
                    }
                `;
                contents.addStylesheetRules({
                    body: {
                        background: `${currentTheme.backgroundColor} !important`,
                        color: `${currentTheme.textColor} !important`,
                        transition: 'background-color 0.2s, color 0.2s'
                    }
                });
                
                // 添加样式标签
                const style = contents.doc.createElement('style');
                style.innerHTML = styles;
                contents.doc.head.appendChild(style);
            });

            // 设置渲染配置
            rendition.themes.default({
                body: {
                    background: `${currentTheme.backgroundColor} !important`,
                    color: `${currentTheme.textColor} !important`
                }
            });
        }
    }, [rendition, currentTheme]);

    // 切换背景色
    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        let themeColors = {
            backgroundColor: '#ffffff',
            textColor: '#000000'
        };

        switch (newTheme) {
            case 'sepia':
                themeColors = {
                    backgroundColor: '#f4ecd8',
                    textColor: '#42321A'
                };
                break;
            case 'dark':
                themeColors = {
                    backgroundColor: '#333333',
                    textColor: '#dddddd'
                };
                break;
        }

        setCurrentTheme(themeColors);

        // 立即应用到当前内容
        if (rendition) {
            rendition.getContents().forEach(contents => {
                if (contents && contents.doc && contents.doc.body) {
                    contents.doc.body.style.backgroundColor = themeColors.backgroundColor;
                    contents.doc.body.style.color = themeColors.textColor;
                }
            });
        }
    };

    // 切换单双页
    const handlePageLayoutChange = (isDouble) => {
        setIsDoublePage(isDouble);
        if (rendition) {
            rendition.spread(isDouble ? 'double' : 'single');
        }
    };

    // 当字体大小改变时更新 epub 内容
    useEffect(() => {
        if (rendition) {
            rendition.themes.fontSize(`${fontSize}%`);
        }
    }, [fontSize, rendition]);

    useEffect(() => {
        if (!viewerRef.current) return

        const bookUrl = localStorage.getItem('bookUrl')
        const bookInstance = ePub(bookUrl)
        // const bookInstance = ePub(`/books/${bookId}`)
        setBook(bookInstance)

        // 获取目录
        bookInstance.loaded.navigation.then(nav => {
            setToc(nav.toc)
        })

        // 检测书籍的排版方向
        bookInstance.loaded.metadata.then(metadata => {
            const isVertical =
                metadata.direction === 'rtl' ||
                bookId.toLowerCase().includes('vertical') ||
                (metadata.language && ['ja', 'zh'].includes(metadata.language.toLowerCase()))

            const renditionInstance = bookInstance.renderTo(viewerRef.current, {
                width: '100%',
                height: '100%',
                allowScriptedContent: true,
                flow: 'paginated',
                spread: isVertical ? 'none' : 'auto',
                direction: isVertical ? 'rtl' : 'ltr'
            })

            setRendition(renditionInstance)

            // 监听页面变化
            renditionInstance.on('relocated', (location) => {
                if (bookInstance.locations.length() > 0) {
                    const locationIndex = bookInstance.locations.locationFromCfi(location.start.cfi)
                    setCurrentPage(locationIndex + 1)
                }
            })

            // 等待内容加载完成后计算页数
            renditionInstance.display().then(() => {
                if (renditionInstance.manager?.stage?.resizeObserver) {
                    renditionInstance.manager.stage.resizeObserver.disconnect()
                    renditionInstance.manager.stage.resizeObserver = null
                }

                if (renditionInstance.manager) {
                    originalResizeHandlerRef.current = renditionInstance.manager.resize.bind(renditionInstance.manager)

                    renditionInstance.manager.resize = () => {
                        let resizeTimeout = null
                        if (!isResizing && originalResizeHandlerRef.current) {
                            // 清除之前的定时器
                            if (resizeTimeout) {
                                clearTimeout(resizeTimeout)
                            }

                            // 设置新的定时器
                            resizeTimeout = setTimeout(() => {
                                setIsResizing(false)
                                originalResizeHandlerRef.current()
                            }, 1000)
                        }
                    }
                }

                recalculatePages(bookInstance, renditionInstance)
            })

            // 添加窗口大小变化监听
            const handleResize = () => {
                if (!isResizing) {
                    setIsResizing(true)
                }
            }

            window.addEventListener('resize', handleResize)

            return () => {
                window.removeEventListener('resize', handleResize)

            }
        })

        const handleKeyPress = (e) => {
            if (rendition) {
                if (e.key === 'ArrowLeft') rendition.prev()
                if (e.key === 'ArrowRight') rendition.next()
            }
        }

        document.addEventListener('keyup', handleKeyPress)

        return () => {
            document.removeEventListener('keyup', handleKeyPress)
            if (bookInstance) {
                bookInstance.destroy()
            }
        }
    }, [bookId])

    const handleTocItemClick = href => {
        if (rendition) {
            rendition.display(href)
            setShowToc(false)
        }
    }

    // 递归渲染目录项的辅助函数
    const renderTocItems = (items) => {
        return items.map((item, index) => (
            <div key={index}>
                <div 
                    className="toc-item"
                    onClick={() => handleTocItemClick(item.href)}
                >
                    <span className="toc-label">{item.label}</span>
                    <span className="toc-page">{item.page || '-'}</span>
                </div>
                {item.subitems && item.subitems.length > 0 && (
                    <div className="toc-subitems">
                        {renderTocItems(item.subitems)}
                    </div>
                )}
            </div>
        ))
    }

    return (
        <div className="reader">
            <div className="toolbar">
                <div className="toolbar-left">
                    <button 
                        className="toolbar-button"
                        onClick={() => navigate('/')}
                    >
                        <LeftOutlined />
                    </button>
                    <button 
                        className="toolbar-button"
                        onClick={() => setShowToc(!showToc)}
                    >
                        <UnorderedListOutlined />
                    </button>
                </div>
                <div className="toolbar-title">
                    {getBookNameFromPath()}
                </div>
                <div className="toolbar-right">
                    <button 
                        className="toolbar-button"
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <FontSizeOutlined />
                    </button>
                </div>
            </div>
            <div className={`toc-panel ${showToc ? 'active' : ''}`}>
                {renderTocItems(toc)}
            </div>
            <div className="reader-layout">
                <button className="nav-button prev" onClick={() => rendition?.prev()}>‹</button>
                <div className="reader-container">
                    <div
                        ref={viewerRef}
                        style={{ width: '100%', height: '100%' }}
                    ></div>
                    <div className={`resize-overlay ${isResizing ? 'active' : ''}`}></div>
                    <div className="page-info">
                        {currentPage} / {totalPages}页
                    </div>
                </div>
                <button className="nav-button next" onClick={() => rendition?.next()}>›</button>
            </div>

            {showSettings && (
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
                            <button 
                                className={`theme-button white ${theme === 'white' ? 'active' : ''}`}
                                onClick={() => handleThemeChange('white')}
                                title="白色主题"
                            ></button>
                            <button 
                                className={`theme-button sepia ${theme === 'sepia' ? 'active' : ''}`}
                                onClick={() => handleThemeChange('sepia')}
                                title="护眼模式"
                            ></button>
                            <button 
                                className={`theme-button dark ${theme === 'dark' ? 'active' : ''}`}
                                onClick={() => handleThemeChange('dark')}
                                title="夜间模式"
                            ></button>
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
            )}
        </div>
    )
}

export default Reader 