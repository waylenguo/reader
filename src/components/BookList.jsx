import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './BookList.css'

function BookList() {
  const [books, setBooks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // 这里需要实现一个后端API来获取books目录下的书籍列表
    // 暂时使用模拟数据
    const fetchBooks = async () => {
      setIsLoading(true)
      try {
        const bookList = [
          {
            id: '1',
            title: '功能性意象訓練（測試用）',
            filename: '功能性意象訓練（測試用）.epub',
            url: 'https://aigo.s3.cn-northwest-1.amazonaws.com.cn/epub/%E5%8A%9F%E8%83%BD%E6%80%A7%E6%84%8F%E8%B1%A1%E8%A8%93%E7%B7%B4%EF%BC%88%E6%B8%AC%E8%A9%A6%E7%94%A8%EF%BC%89.epub',
            cover: null
          },
          {
            id: '2',
            title: '迷妹的韓文自學法_黑體加粗（測試用）',
            filename: '迷妹的韓文自學法_黑體加粗（測試用）.epub',
            url: 'https://aigo.s3.cn-northwest-1.amazonaws.com.cn/epub/%E8%BF%B7%E5%A6%B9%E7%9A%84%E9%9F%93%E6%96%87%E8%87%AA%E5%AD%B8%E6%B3%95_%E9%BB%91%E9%AB%94%E5%8A%A0%E7%B2%97%EF%BC%88%E6%B8%AC%E8%A9%A6%E7%94%A8%EF%BC%89.epub',
            cover: null
          },
          
          // 可以添加更多书籍
        ]
        setBooks(bookList)
      } catch (error) {
        console.error('获取书籍失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBooks()
  }, [])

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleBookSelect = (book) => {
    localStorage.setItem('bookUrl', book.url)
    navigate(`/reader/${encodeURIComponent(book.filename)}`)
  }

  return (
    <div className="book-list-container">
      <header className="book-list-header">
        <div className="header-content">
          <h1>我的书架</h1>
        </div>
      </header>

      <div className="content-wrapper">
        <div className="search-section">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="搜索书籍..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="search-icon">🔍</i>
          </div>
        </div>

        {isLoading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="books-masonry">
            {filteredBooks.map(book => (
              <div
                key={book.id}
                className="book-item"
                onClick={() => handleBookSelect(book)}
              >
                <div className="book-cover-wrapper">
                  {book.cover ? (
                    <img src={book.cover} alt={book.title} className="book-cover" />
                  ) : (
                    <div className="book-cover-placeholder">
                      <span>{book.title[0]}</span>
                    </div>
                  )}
                  <div className="book-hover-info">
                    <button className="read-now-btn">开始阅读</button>
                  </div>
                </div>
                <div className="book-details">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">{book.author || '未知作者'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookList 