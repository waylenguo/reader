import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ePub from 'epubjs'
import './Reader.css'
import { LeftOutlined, UnorderedListOutlined, FontSizeOutlined, CodeSandboxCircleFilled, MenuOutlined } from '@ant-design/icons'
import { THEMES, DEFAULT_THEME } from '../config/themes'
import ReaderSettings from './ReaderSettings'

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
    const [theme, setTheme] = useState(DEFAULT_THEME)
    const [isDoublePage, setIsDoublePage] = useState(false)
    const [currentTheme, setCurrentTheme] = useState(THEMES[DEFAULT_THEME].colors)

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

    // 修改初始化样式的 useEffect
    useEffect(() => {
        // 更新整个阅读器界面的颜色
        document.documentElement.style.setProperty('--reader-bg-color', currentTheme.backgroundColor);
        document.documentElement.style.setProperty('--reader-text-color', currentTheme.textColor);
        // 添加设置面板的背景色变量
        document.documentElement.style.setProperty('--settings-bg-color', currentTheme.backgroundColor);

        if (rendition) {
            // 设置 EPUB 内容的样式
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
                
                const style = contents.doc.createElement('style');
                style.innerHTML = styles;
                contents.doc.head.appendChild(style);
            });

            rendition.themes.default({
                body: {
                    background: `${currentTheme.backgroundColor} !important`,
                    color: `${currentTheme.textColor} !important`,
                }
            });
        }
    }, [rendition, currentTheme]);

    // 切换背景色
    const handleThemeChange = (newTheme) => {
        if (THEMES[newTheme]) {
            setTheme(newTheme)
            setCurrentTheme(THEMES[newTheme].colors)
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
        const bookInstance = ePub(bookUrl, {
            requestHeaders: {
                'Access-Control-Allow-Origin': '*'
            }
        })
        setBook(bookInstance)

        // 获取目录 - 移除等待位置信息生成
        bookInstance.loaded.navigation.then(nav => {
            console.log(nav);
            setToc(nav.toc);
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
                </div>
                {item.subitems && item.subitems.length > 0 && (
                    <div className="toc-subitems">
                        {renderTocItems(item.subitems)}
                    </div>
                )}
            </div>
        ))
    }

    // 添加点击处理函数
    const handleOutsideClick = (e) => {
        // 如果目录面板是打开的，且点击的不是目录面板内部和目录按钮
        console.log(e.target);
        if (showToc && 
            !e.target.closest('.toc-panel') && 
            !e.target.closest('[data-button="toc"]')) {
            setShowToc(false);
        }
    };

    // 在组件挂载时添加点击事件监听
    useEffect(() => {
        window.addEventListener('click', handleOutsideClick);
        return () => {
            window.removeEventListener('click', handleOutsideClick);
        };
        
    }, [rendition, showToc]);

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
                        data-button="toc"
                    >
                        <MenuOutlined />
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
                        style={{ width: '100%', height: '100%'  }}
                    ></div>
                    <div className={`resize-overlay ${isResizing ? 'active' : ''}`}></div>
                    <div className="page-info">
                        {currentPage} / {totalPages}页
                    </div>
                </div>
                <button className="nav-button next" onClick={() => rendition?.next()}>›</button>
            </div>

            {showSettings && (
                <ReaderSettings
                    fontSize={fontSize}
                    adjustFontSize={adjustFontSize}
                    brightness={brightness}
                    handleBrightnessChange={handleBrightnessChange}
                    theme={theme}
                    handleThemeChange={handleThemeChange}
                    isDoublePage={isDoublePage}
                    handlePageLayoutChange={handlePageLayoutChange}
                />
            )}
        </div>
    )
}

export default Reader 