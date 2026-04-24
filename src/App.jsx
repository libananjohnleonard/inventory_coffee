import { useEffect, useState } from 'react'
import { inventoryApi } from './lib/api'

const navigationItems = [
  { id: 'Dashboard', label: 'Dashboard' },
  { id: 'Inventory', label: 'Manage Products' },
  { id: 'Reports', label: 'Analytics' },
  { id: 'Profile', label: 'Profile' },
]
const inventoryColumns = ['Product', 'Category', 'Unit', 'Quantity', 'Description', 'Actions']
const PAGE_SIZE = 10
const SESSION_STORAGE_KEY = 'coffee-inventory-session'
const PRODUCT_CATEGORY_OPTIONS = [
  'Coffee',
  'Syrup',
  'Sugar',
  'Milk',
  'Tea',
  'Powder',
  'Pastry',
  'Cups',
  'Lids',
  'Packaging',
  'Cleaning Supply',
  'Other',
]
const PRODUCT_UNIT_OPTIONS = [
  'grams',
  'liters',
  'kilograms',
  'packs',
  'boxes',
  'pieces',
  'bottles',
  'cans',
  'sachets',
  'bags',
]

const emptyProductForm = {
  name: '',
  category: '',
  unit: '',
  description: '',
  items: '',
  imageUrl: '',
  imageName: '',
}

const emptySignInForm = {
  email: '',
  password: '',
}

function getStoredSession() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(SESSION_STORAGE_KEY) === 'active'
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Unable to read image file.'))

    reader.readAsDataURL(file)
  })
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'BC'
}

function formatQuantity(value) {
  const amount = Number(value || 0)
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '')
}

function formatStockQuantity(value, unit = '') {
  return unit ? `${formatQuantity(value)} ${unit}` : formatQuantity(value)
}

function getDropdownOptions(options, currentValue) {
  const normalizedValue = currentValue.trim()

  if (!normalizedValue || options.includes(normalizedValue)) {
    return options
  }

  return [normalizedValue, ...options]
}

function buildUpdateMessage({ previousProduct, nextValues, mode }) {
  if (mode === 'add') {
    return 'New inventory item added'
  }

  if (!previousProduct) {
    return 'Inventory item updated'
  }

  const updates = []
  const nextItems = Number(nextValues.items || 0)
  const previousItems = Number(previousProduct.items || 0)
  const itemDelta = nextItems - previousItems

  if (itemDelta !== 0) {
    updates.push(
      `${itemDelta > 0 ? '+' : ''}${itemDelta} ${
        Math.abs(itemDelta) === 1 ? 'item' : 'items'
      } updated`,
    )
  }

  if (previousProduct.description.trim() !== nextValues.description.trim()) {
    updates.push('Description updated')
  }

  const previousImage = previousProduct.imageUrl.trim()
  const nextImage = nextValues.imageUrl.trim()

  if (previousImage && !nextImage) {
    updates.push('Image deleted')
  } else if (!previousImage && nextImage) {
    updates.push('Image added')
  } else if (previousImage !== nextImage) {
    updates.push('Image updated')
  }

  const detailsChanged =
    previousProduct.name.trim() !== nextValues.name.trim() ||
    previousProduct.category.trim() !== nextValues.category.trim() ||
    previousProduct.unit.trim() !== nextValues.unit.trim()

  if (!updates.length && detailsChanged) {
    updates.push('Product details updated')
  }

  if (!updates.length) {
    updates.push(previousProduct.updates || 'No recent changes')
  }

  return updates.slice(0, 2).join(' / ')
}

function filterProducts(products, searchQuery) {
  const keyword = searchQuery.trim().toLowerCase()

  if (!keyword) {
    return products
  }

  return products.filter((product) =>
    [
      product.name,
      product.category,
      product.unit,
      product.description,
      product.updates,
      getStockStatus(product.items),
      String(product.items),
      formatQuantity(product.items),
      formatStockQuantity(product.items, product.unit),
    ]
      .join(' ')
      .toLowerCase()
      .includes(keyword),
  )
}

function getDashboardStats(products) {
  const totalProducts = products.length
  const totalStock = products.reduce((sum, product) => sum + Number(product.items || 0), 0)
  const lowStock = products.filter((product) => {
    const quantity = Number(product.items || 0)
    return quantity > 0 && quantity <= 20
  }).length
  const outOfStock = products.filter((product) => Number(product.items || 0) <= 0).length

  return [
    {
      label: 'Total Products',
      value: totalProducts,
      note: 'Tracked drinks, ingredients, and service supplies.',
      tone: 'primary',
    },
    {
      label: 'Total Stock Quantity',
      value: formatQuantity(totalStock),
      note: 'Combined units currently counted in the stockroom.',
      tone: 'secondary',
    },
    {
      label: 'Low Stock',
      value: `${lowStock} products`,
      note: 'Items that should be refilled before the next busy shift.',
      tone: 'warning',
    },
    {
      label: 'Out of Stock',
      value: `${outOfStock} products`,
      note: 'Items that need immediate replenishment.',
      tone: 'danger',
    },
  ]
}

function getStockStatus(items) {
  const quantity = Number(items || 0)
  if (quantity <= 0) return 'Out of Stock'
  if (quantity <= 20) return 'Low Stock'
  return 'In Stock'
}

function getStockStatusClass(status) {
  if (status === 'Out of Stock') return 'stock-status is-out'
  if (status === 'Low Stock') return 'stock-status is-low'
  return 'stock-status is-healthy'
}

function getStockStatusNote(status) {
  if (status === 'Out of Stock') {
    return 'This item needs immediate restocking before the next service window.'
  }

  if (status === 'Low Stock') {
    return 'This item is running low and should be refilled soon.'
  }

  return 'This item is in stock and ready for service.'
}

function getTotalPages(totalItems) {
  return Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
}

function paginateProducts(products, page) {
  const startIndex = (page - 1) * PAGE_SIZE
  return products.slice(startIndex, startIndex + PAGE_SIZE)
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [products, setProducts] = useState([])
  const [editor, setEditor] = useState({ open: false, mode: 'add', productId: null })
  const [formValues, setFormValues] = useState(emptyProductForm)
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pageByView, setPageByView] = useState({ Dashboard: 1, Inventory: 1 })
  const [account, setAccount] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(getStoredSession)
  const [isAuthLoading, setIsAuthLoading] = useState(getStoredSession)
  const [isProductsLoading, setIsProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [signInForm, setSignInForm] = useState(emptySignInForm)
  const [signInError, setSignInError] = useState('')
  const isModalOpen = editor.open || Boolean(deleteTarget) || Boolean(viewTarget)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (isAuthenticated) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, 'active')
      return
    }

    window.localStorage.removeItem(SESSION_STORAGE_KEY)
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      setIsAuthLoading(false)
      setAccount(null)
      setProducts([])
      return
    }

    let isCancelled = false

    async function bootstrap() {
      setIsAuthLoading(true)
      setIsProductsLoading(true)

      try {
        const [profileResponse, productsResponse] = await Promise.all([
          inventoryApi.getProfile(),
          inventoryApi.getProducts(),
        ])

        if (isCancelled) return

        setAccount(profileResponse.user)
        setProducts(productsResponse.products || [])
        setProductsError('')
      } catch {
        if (isCancelled) return

        setIsAuthenticated(false)
        setSignInError('Unable to restore your session. Please sign in again.')
        setProductsError('')
      } finally {
        if (!isCancelled) {
          setIsAuthLoading(false)
          setIsProductsLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      isCancelled = true
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const { body, documentElement } = document
    const previousOverflow = body.style.overflow
    const previousPaddingRight = body.style.paddingRight

    if (isModalOpen) {
      const scrollbarWidth = window.innerWidth - documentElement.clientWidth
      body.style.overflow = 'hidden'

      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`
      }
    }

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPaddingRight
    }
  }, [isModalOpen])

  const filteredProducts = filterProducts(products, searchQuery)
  const dashboardStats = getDashboardStats(products)
  const dashboardTotalPages = getTotalPages(filteredProducts.length)
  const inventoryTotalPages = getTotalPages(filteredProducts.length)
  const currentDashboardPage = Math.min(pageByView.Dashboard, dashboardTotalPages)
  const currentInventoryPage = Math.min(pageByView.Inventory, inventoryTotalPages)
  const dashboardProducts = paginateProducts(filteredProducts, currentDashboardPage)
  const inventoryProducts = paginateProducts(filteredProducts, currentInventoryPage)
  const showHeaderSearch = activePage === 'Dashboard' || activePage === 'Inventory'
  const headerSearchPlaceholder = 'Search products, category, status, or quantity...'

  const closeEditor = () => {
    setEditor({ open: false, mode: 'add', productId: null })
    setFormValues(emptyProductForm)
    setIsImageLoading(false)
    setIsSavingProduct(false)
  }

  const openAddModal = () => {
    setEditor({ open: true, mode: 'add', productId: null })
    setFormValues(emptyProductForm)
    setIsImageLoading(false)
  }

  const openEditModal = (product) => {
    setEditor({ open: true, mode: 'edit', productId: product.id })
    setFormValues({
      name: product.name,
      category: product.category,
      unit: product.unit,
      description: product.description,
      items: String(product.items),
      imageUrl: product.imageUrl,
      imageName: product.imageUrl ? `${product.name} image` : '',
    })
    setIsImageLoading(false)
  }

  const closeOverlays = () => {
    setDeleteTarget(null)
    setViewTarget(null)
    closeEditor()
  }

  const handleNavigate = (page) => {
    setActivePage(page)
    closeOverlays()
  }

  const handleProductFieldChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }))
  }

  const handleImageSelect = async (file) => {
    if (!file) return

    setIsImageLoading(true)

    try {
      const imageUrl = await readFileAsDataUrl(file)

      setFormValues((current) => ({
        ...current,
        imageUrl,
        imageName: file.name,
      }))
    } finally {
      setIsImageLoading(false)
    }
  }

  const handleImageRemove = () => {
    setFormValues((current) => ({
      ...current,
      imageUrl: '',
      imageName: '',
    }))
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setPageByView({ Dashboard: 1, Inventory: 1 })
  }

  const handlePageChange = (pageName, nextPage) => {
    setPageByView((current) => ({
      ...current,
      [pageName]: Math.max(1, nextPage),
    }))
  }

  const handleProductSubmit = async (event) => {
    event.preventDefault()

    if (isImageLoading || isSavingProduct) {
      return
    }

    const previousProduct =
      editor.mode === 'edit'
        ? products.find((product) => product.id === editor.productId) ?? null
        : null

    const payload = {
      name: formValues.name.trim(),
      category: formValues.category.trim(),
      unit: formValues.unit.trim(),
      description: formValues.description.trim(),
      items: Number(formValues.items),
      imageUrl: formValues.imageUrl.trim(),
      updates: buildUpdateMessage({ previousProduct, nextValues: formValues, mode: editor.mode }),
    }

    setIsSavingProduct(true)

    try {
      if (editor.mode === 'edit') {
        const response = await inventoryApi.updateProduct(editor.productId, payload)
        setProducts((current) =>
          current.map((product) => (product.id === editor.productId ? response.product : product)),
        )
      } else {
        const response = await inventoryApi.createProduct(payload)
        setProducts((current) => [response.product, ...current])
      }

      setProductsError('')
      closeEditor()
    } catch (error) {
      setProductsError(error.message)
      setIsSavingProduct(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      await inventoryApi.deleteProduct(deleteTarget.id)
      setProducts((current) => current.filter((product) => product.id !== deleteTarget.id))
      setProductsError('')
      setDeleteTarget(null)
    } catch (error) {
      setProductsError(error.message)
    }
  }

  const handleSignInFieldChange = (field, value) => {
    setSignInForm((current) => ({ ...current, [field]: value }))
    setSignInError('')
  }

  const handleSignIn = async (event) => {
    event.preventDefault()

    try {
      const response = await inventoryApi.login(signInForm)
      setAccount(response.user)
      setSignInForm(emptySignInForm)
      setSignInError('')
      setIsAuthenticated(true)
      setActivePage('Dashboard')
    } catch (error) {
      setSignInError(error.message)
    }
  }

  const handleSignOut = () => {
    setIsAuthenticated(false)
    setAccount(null)
    setProducts([])
    setProductsError('')
    setSearchQuery('')
    setPageByView({ Dashboard: 1, Inventory: 1 })
    setActivePage('Dashboard')
    closeOverlays()
  }

  const handleEmailSave = async ({ email, currentPassword }) => {
    const response = await inventoryApi.updateEmail({
      email,
      currentPassword,
    })

    setAccount(response.user)
    return { ok: true, message: 'Email updated successfully.' }
  }

  const handlePasswordSave = async ({ currentPassword, nextPassword }) => {
    await inventoryApi.updatePassword({
      currentPassword,
      nextPassword,
    })

    return { ok: true, message: 'Password updated successfully.' }
  }

  const renderPage = () => {
    if (activePage === 'Dashboard') {
      return (
        <CatalogPanel
          title="Inventory Dashboard"
          tableMode="dashboard"
          displayMode="cards"
          products={dashboardProducts}
          totalCount={products.length}
          searchQuery={searchQuery}
          filteredCount={filteredProducts.length}
          currentPage={currentDashboardPage}
          totalPages={dashboardTotalPages}
          isLoading={isProductsLoading}
          errorMessage={productsError}
          onPreviousPage={() => handlePageChange('Dashboard', currentDashboardPage - 1)}
          onNextPage={() => handlePageChange('Dashboard', currentDashboardPage + 1)}
          summaryCards={dashboardStats}
          onView={setViewTarget}
        />
      )
    }

    if (activePage === 'Inventory') {
      return (
        <CatalogPanel
          title="Coffee Inventory"
          columns={inventoryColumns}
          tableMode="inventory"
          products={inventoryProducts}
          totalCount={products.length}
          searchQuery={searchQuery}
          filteredCount={filteredProducts.length}
          currentPage={currentInventoryPage}
          totalPages={inventoryTotalPages}
          isLoading={isProductsLoading}
          errorMessage={productsError}
          onPreviousPage={() => handlePageChange('Inventory', currentInventoryPage - 1)}
          onNextPage={() => handlePageChange('Inventory', currentInventoryPage + 1)}
          panelActions={
            <button type="button" className="primary-button" onClick={openAddModal}>
              Add Product
            </button>
          }
          manageMode
          onEdit={openEditModal}
          onDelete={setDeleteTarget}
        />
      )
    }

    if (activePage === 'Reports') {
      return <ReportsPanel products={products} />
    }

    if (activePage === 'Profile' && account) {
      return (
        <ProfilePanel
          key={`${account.email}-${account.name}-${account.role}-${account.workspace}`}
          account={account}
          onEmailSave={handleEmailSave}
          onPasswordSave={handlePasswordSave}
        />
      )
    }
    return null
  }

  if (isAuthLoading) {
    return <LoadingScreen message="Loading your coffee shop inventory..." />
  }

  if (!isAuthenticated) {
    return (
      <SignInScreen
        formValues={signInForm}
        error={signInError}
        onChange={handleSignInFieldChange}
        onSubmit={handleSignIn}
      />
    )
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Brand />
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === activePage ? 'sidebar-nav-button is-active' : 'sidebar-nav-button'}
              onClick={() => handleNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {account ? <SidebarAccountPanel account={account} onSignOut={handleSignOut} /> : null}
      </aside>

      <section className="content-shell">
        {account && showHeaderSearch ? (
          <header className="content-topbar">
            <div className="content-topbar-main">
              <div className="content-topbar-tools">
                <label className="topbar-search-field">
                  <span className="topbar-search-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle
                        cx="11"
                        cy="11"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="1.9"
                      />
                      <path
                        d="M20 20L16.2 16.2"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    placeholder={headerSearchPlaceholder}
                    aria-label={`Search ${activePage.toLowerCase()}`}
                  />
                </label>
              </div>
            </div>
          </header>
        ) : null}

        <section className="page-wrap">{renderPage()}</section>
      </section>

      {editor.open ? (
        <ProductModal
          mode={editor.mode}
          formValues={formValues}
          onChange={handleProductFieldChange}
          onImageSelect={handleImageSelect}
          onImageRemove={handleImageRemove}
          onClose={closeEditor}
          onSubmit={handleProductSubmit}
          isImageLoading={isImageLoading}
          isSaving={isSavingProduct}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteModal
          product={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      ) : null}

      {viewTarget ? <ProductDetailsModal product={viewTarget} onClose={() => setViewTarget(null)} /> : null}
    </main>
  )
}

function LoadingScreen({ message }) {
  return (
    <main className="auth-shell auth-shell-loading">
      <section className="auth-card auth-card-loading">
        <div className="auth-copy">
          <Brand auth />
          <p className="panel-kicker">Loading</p>
          <h1 className="auth-title">Opening BrixCafee</h1>
          <p className="auth-description">{message}</p>
        </div>
      </section>
    </main>
  )
}

function Brand({ auth = false }) {
  return (
    <div className={auth ? 'brand brand-auth' : 'brand'}>
      <div className="brand-icon" aria-hidden="true">
        <svg
          className="brand-icon-svg"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 20H30V26C30 29.866 26.866 33 23 33H22C18.134 33 15 29.866 15 26V20Z"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M30 22H32.5C34.433 22 36 23.567 36 25.5C36 27.433 34.433 29 32.5 29H30"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 15C17.8 16.2 17.8 17.8 19 19"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
          />
          <path
            d="M24 13.5C22.8 14.7 22.8 16.5 24 17.7"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
          />
          <path
            d="M29 15C27.8 16.2 27.8 17.8 29 19"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
          />
          <path
            d="M14 36H31"
            stroke="currentColor"
            strokeWidth="2.75"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="brand-text">BrixCafee</span>
    </div>
  )
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 12H10"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 4H7C5.895 4 5 4.895 5 6V18C5 19.105 5.895 20 7 20H10"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M4 20H8L18 10C18.5304 9.46957 18.8284 8.75013 18.8284 8C18.8284 7.24987 18.5304 6.53043 18 6C17.4696 5.46957 16.7501 5.17157 16 5.17157C15.2499 5.17157 14.5304 5.46957 14 6L4 16V20Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 7L17 11"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M5 7H19"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11V17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M14 11V17"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M6 7L7 19C7.054 19.577 7.538 20.018 8.118 20H15.882C16.462 20.018 16.946 19.577 17 19L18 7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 7V5C9 4.448 9.448 4 10 4H14C14.552 4 15 4.448 15 5V7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SidebarAccountPanel({ account, onSignOut }) {
  return (
    <div className="sidebar-footer">
      <div className="sidebar-account">
        <div className="sidebar-account-row">
          <div className="sidebar-avatar">{getInitials(account.name)}</div>
          <div className="sidebar-account-copy">
            <strong>{account.name}</strong>
            <span>{account.email}</span>
          </div>
        </div>
        <button type="button" className="secondary-button sidebar-signout" onClick={onSignOut}>
          <span className="button-icon">
            <SignOutIcon />
          </span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

function PasswordVisibilityIcon({ visible }) {
  if (visible) {
    return (
      <svg
        className="password-visibility-icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3 3L21 21"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.58 10.58C10.2093 10.9507 10 11.4536 10 11.978C10 12.5024 10.2093 13.0053 10.58 13.376C10.9507 13.7467 11.4536 13.956 11.978 13.956C12.5024 13.956 13.0053 13.7467 13.376 13.376"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.944 4.243C10.616 4.083 11.302 4 12 4C18.5 4 22 12 22 12C21.468 12.996 20.795 13.91 20 14.714"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.228 6.228C3.622 8.004 2 12 2 12C2 12 5.5 20 12 20C13.847 20 15.444 19.353 16.781 18.438"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <svg
      className="password-visibility-icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 12C2 12 5.5 4 12 4C18.5 4 22 12 22 12C22 12 18.5 20 12 20C5.5 20 2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.9"
      />
    </svg>
  )
}

function PasswordInput({ value, onChange, placeholder, showPassword, onToggle, required = true }) {
  return (
    <div className="password-input-wrap">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
      <button
        type="button"
        className="password-visibility-toggle"
        onClick={onToggle}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        aria-pressed={showPassword}
        title={showPassword ? 'Hide password' : 'Show password'}
      >
        <PasswordVisibilityIcon visible={showPassword} />
      </button>
    </div>
  )
}

function SignInScreen({ formValues, error, onChange, onSubmit }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <main className="auth-shell">
      <section className="auth-card auth-card-signin">
        <form className="auth-form auth-form-signin" onSubmit={onSubmit}>
          <div className="auth-copy auth-copy-signin">
            <Brand auth />
          </div>

          <div className="auth-form-header">
            <h1 className="auth-form-title auth-form-title-signin">Sign in</h1>
            <p className="auth-form-text">
              Enter your email and password to access the inventory system.
            </p>
          </div>

          <label className="form-field">
            Email
            <input
              type="email"
              value={formValues.email}
              onChange={(event) => onChange('email', event.target.value)}
              placeholder="Enter your email"
              required
            />
          </label>

          <label className="form-field">
            Password
            <PasswordInput
              value={formValues.password}
              onChange={(event) => onChange('password', event.target.value)}
              placeholder="Enter your password"
              showPassword={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
            />
          </label>

          {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

          <button type="submit" className="primary-button auth-submit">
            Sign In
          </button>

          <p className="auth-form-note">Authorized admin access only.</p>
        </form>
      </section>
    </main>
  )
}

function SummaryCards({ cards, ariaLabel }) {
  return (
    <section className="dashboard-summary-grid" aria-label={ariaLabel}>
      {cards.map((card, index) => (
        <article
          key={card.label}
          className={`dashboard-summary-card dashboard-summary-card--${card.tone || 'neutral'}`}
        >
          <div className="dashboard-summary-side" aria-hidden="true">
            <span className="dashboard-summary-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="dashboard-summary-side-line" />
          </div>
          <div className="dashboard-summary-content">
            <div className="dashboard-summary-top">
              <span className="dashboard-summary-label">{card.label}</span>
            </div>
            <strong>{card.value}</strong>
            {card.note ? <p>{card.note}</p> : null}
          </div>
        </article>
      ))}
    </section>
  )
}

function CatalogPanel({
  title,
  products,
  totalCount,
  searchQuery,
  filteredCount,
  currentPage,
  totalPages,
  isLoading,
  errorMessage,
  columns = [],
  tableMode = 'inventory',
  displayMode = 'table',
  onPreviousPage,
  onNextPage,
  summaryCards = null,
  panelActions = null,
  manageMode = false,
  onEdit = null,
  onDelete = null,
  onView = null,
}) {
  return (
    <section className="inventory-panel" aria-label={title}>
      {errorMessage ? <p className="panel-status panel-status-error">{errorMessage}</p> : null}

      {summaryCards?.length ? (
        <SummaryCards cards={summaryCards} ariaLabel={`${title} summary`} />
      ) : null}

      {panelActions ? <div className="inventory-panel-actions">{panelActions}</div> : null}

      <div className={displayMode === 'cards' ? 'inventory-grid inventory-grid--cards' : 'inventory-grid'}>
        {displayMode === 'table' ? (
          <>
            <div className={`inventory-header inventory-header--${tableMode}`} role="row">
              {columns.map((column) => (
                <div key={column} className="inventory-heading" role="columnheader">
                  {column}
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="empty-state">
                <strong>Loading inventory records...</strong>
                <p>Your latest coffee shop stock details are being fetched.</p>
              </div>
            ) : products.length ? (
              <div className="inventory-body">
                {products.map((product) => {
                  const status = getStockStatus(product.items)

                  return (
                    <article key={product.id} className={`inventory-row inventory-row--${tableMode}`} role="row">
                      <div className="inventory-cell product-cell" role="cell">
                        <ProductImage name={product.name} imageUrl={product.imageUrl} />
                        <div className="product-meta">
                          <strong>{product.name}</strong>
                          <span>{manageMode ? 'Coffee shop inventory item' : `Status: ${status}`}</span>
                        </div>
                      </div>
                      <div className="inventory-cell" role="cell">
                        {product.category}
                      </div>

                      {tableMode === 'inventory' ? (
                        <>
                          <div className="inventory-cell" role="cell">
                            {product.unit}
                          </div>
                          <div className="inventory-cell quantity-cell" role="cell">
                            {formatQuantity(product.items)}
                          </div>
                          <div className="inventory-cell description-cell" role="cell">
                            {product.description}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="inventory-cell quantity-cell" role="cell">
                            {formatStockQuantity(product.items, product.unit)}
                          </div>
                          <div className="inventory-cell" role="cell">
                            <span className={getStockStatusClass(status)}>{status}</span>
                          </div>
                          <div className="inventory-cell updates-cell" role="cell">
                            {product.updates}
                          </div>
                        </>
                      )}

                      <div className="inventory-cell" role="cell">
                        {manageMode ? (
                          <div className="action-group">
                            <button
                              type="button"
                              className="inline-button inline-button-accent inline-button-icon"
                              onClick={() => onEdit(product)}
                              aria-label={`Update ${product.name}`}
                              title="Update"
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              className="inline-button inline-button-danger inline-button-icon"
                              onClick={() => onDelete(product)}
                              aria-label={`Delete ${product.name}`}
                              title="Delete"
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        ) : (
                          <button type="button" className="inline-button" onClick={() => onView(product)}>
                            View
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <strong>{totalCount ? 'No matching products found.' : 'No inventory items added yet.'}</strong>
                <p>
                  {totalCount
                    ? `Try a different search term or clear "${searchQuery}".`
                    : 'Use the Manage Products page to add your first coffee shop product or supply.'}
                </p>
              </div>
            )}
          </>
        ) : isLoading ? (
          <div className="empty-state">
            <strong>Loading inventory records...</strong>
            <p>Your latest coffee shop stock details are being fetched.</p>
          </div>
        ) : products.length ? (
          <div className="dashboard-card-grid">
            {products.map((product) => {
              const status = getStockStatus(product.items)
              const showLowStockBadge = status === 'Low Stock'

              return (
                <article key={product.id} className="dashboard-product-card">
                  <div className="dashboard-product-media">
                    <ProductImage name={product.name} imageUrl={product.imageUrl} />
                  </div>

                  <div className="dashboard-product-copy">
                    <div className="dashboard-product-top">
                      <span className="dashboard-product-category">{product.category}</span>
                      {showLowStockBadge ? (
                        <span className={getStockStatusClass(status)}>{status}</span>
                      ) : null}
                    </div>

                    <div className="dashboard-product-heading">
                      <strong>{product.name}</strong>
                      <span>{product.unit}</span>
                    </div>

                    <div className="dashboard-product-metric">
                      <span>Current Stock</span>
                      <strong>{formatStockQuantity(product.items, product.unit)}</strong>
                    </div>

                    {status === 'Out of Stock' ? (
                      <p className="dashboard-product-alert dashboard-product-alert--out">
                        Out of stock. Refill needed.
                      </p>
                    ) : null}

                    <button
                      type="button"
                      className="secondary-button dashboard-product-action"
                      onClick={() => onView(product)}
                    >
                      View Product
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <strong>{totalCount ? 'No matching products found.' : 'No inventory items added yet.'}</strong>
            <p>
              {totalCount
                ? `Try a different search term or clear "${searchQuery}".`
                : 'Use the Manage Products page to add your first coffee shop product or supply.'}
            </p>
          </div>
        )}

        {filteredCount && !isLoading ? (
          <div className="table-footer">
            <span className="pagination-status">
              Page {currentPage} of {totalPages}
            </span>
            <div className="pagination-actions">
              <button
                type="button"
                className="pagination-button"
                onClick={onPreviousPage}
                disabled={currentPage === 1}
              >
                Prev
              </button>
              <button
                type="button"
                className="pagination-button"
                onClick={onNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function ReportsPanel({ products }) {
  const totalProducts = products.length
  const lowStockProducts = products.filter((product) => getStockStatus(product.items) === 'Low Stock')
  const outOfStockProducts = products.filter((product) => getStockStatus(product.items) === 'Out of Stock')
  const latestActivity = [...products].slice(0, 5)
  const reportSummaryCards = [
    {
      label: 'Total Products',
      value: totalProducts,
      tone: 'primary',
    },
    {
      label: 'Low Stock',
      value: `${lowStockProducts.length} items`,
      tone: 'warning',
    },
    {
      label: 'Out Of Stock',
      value: `${outOfStockProducts.length} items`,
      tone: 'danger',
    },
  ]

  return (
    <section className="inventory-panel report-panel" aria-label="Analytics">
      <SummaryCards cards={reportSummaryCards} ariaLabel="Analytics summary" />

      <section className="reports-layout reports-layout--clean">
        <article className="report-card report-card--wide">
          <div className="report-card-header report-card-header--compact">
            <p className="panel-kicker">Analytics</p>
            <h2 className="report-title">Recent Updates</h2>
          </div>
          <div className="report-list">
            {latestActivity.length ? (
              latestActivity.map((product) => (
                <div key={product.id} className="report-item">
                  <div className="report-item-copy">
                    <strong>{product.name}</strong>
                    <span>{product.updates}</span>
                  </div>
                  <strong className="report-item-value">{formatStockQuantity(product.items, product.unit)}</strong>
                </div>
              ))
            ) : (
              <p className="report-empty">No inventory activity yet.</p>
            )}
          </div>
        </article>

        <div className="reports-secondary-grid">
          <article className="report-card">
            <div className="report-card-header report-card-header--compact">
              <p className="panel-kicker">Attention</p>
              <h2 className="report-title">Low Stock</h2>
            </div>
            <div className="report-list">
              {lowStockProducts.length ? (
                lowStockProducts.map((product) => (
                  <div key={product.id} className="report-item">
                    <div className="report-item-copy">
                      <strong>{product.name}</strong>
                      <span>
                        {product.category} / {product.unit}
                      </span>
                    </div>
                    <strong className="report-item-value">{formatStockQuantity(product.items, product.unit)}</strong>
                  </div>
                ))
              ) : (
                <p className="report-empty">No low stock items right now.</p>
              )}
            </div>
          </article>

          <article className="report-card">
            <div className="report-card-header report-card-header--compact">
              <p className="panel-kicker">Critical</p>
              <h2 className="report-title">Out Of Stock</h2>
            </div>
            <div className="report-list">
              {outOfStockProducts.length ? (
                outOfStockProducts.map((product) => (
                  <div key={product.id} className="report-item">
                    <div className="report-item-copy">
                      <strong>{product.name}</strong>
                      <span>{product.category}</span>
                    </div>
                    <strong className="report-item-value">{formatStockQuantity(product.items, product.unit)}</strong>
                  </div>
                ))
              ) : (
                <p className="report-empty">No out-of-stock items right now.</p>
              )}
            </div>
          </article>
        </div>
      </section>
    </section>
  )
}

function ProfilePanel({ account, onEmailSave, onPasswordSave }) {
  const [emailForm, setEmailForm] = useState({
    email: account.email,
    currentPassword: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    nextPassword: '',
    confirmPassword: '',
  })
  const [emailFeedback, setEmailFeedback] = useState(null)
  const [passwordFeedback, setPasswordFeedback] = useState(null)
  const [passwordVisibility, setPasswordVisibility] = useState({
    emailCurrent: false,
    passwordCurrent: false,
    passwordNext: false,
    passwordConfirm: false,
  })

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((current) => ({
      ...current,
      [field]: !current[field],
    }))
  }

  const handleEmailSubmit = async (event) => {
    event.preventDefault()

    if (!emailForm.email.trim() || !emailForm.currentPassword) {
      setEmailFeedback({ tone: 'error', message: 'Enter the new email and your current password.' })
      return
    }

    try {
      const result = await onEmailSave(emailForm)
      setEmailFeedback({ tone: result.ok ? 'success' : 'error', message: result.message })

      if (result.ok) {
        setEmailForm((current) => ({ ...current, currentPassword: '' }))
      }
    } catch (error) {
      setEmailFeedback({ tone: 'error', message: error.message })
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()

    if (!passwordForm.currentPassword || !passwordForm.nextPassword || !passwordForm.confirmPassword) {
      setPasswordFeedback({ tone: 'error', message: 'Complete all password fields before saving.' })
      return
    }

    if (passwordForm.nextPassword.length < 4) {
      setPasswordFeedback({ tone: 'error', message: 'Use at least 4 characters for the new password.' })
      return
    }

    if (passwordForm.nextPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ tone: 'error', message: 'New password and confirmation do not match.' })
      return
    }

    try {
      const result = await onPasswordSave(passwordForm)
      setPasswordFeedback({ tone: result.ok ? 'success' : 'error', message: result.message })

      if (result.ok) {
        setPasswordForm({
          currentPassword: '',
          nextPassword: '',
          confirmPassword: '',
        })
      }
    } catch (error) {
      setPasswordFeedback({ tone: 'error', message: error.message })
    }
  }

  return (
    <section className="inventory-panel profile-panel" aria-label="Profile">
      <section className="profile-workspace">
        <aside className="profile-rail">
          <article className="profile-hero-card">
            <div className="profile-hero-top">
              <div className="profile-avatar profile-avatar--hero">{getInitials(account.name)}</div>
              <div className="profile-identity">
                <p className="panel-kicker">Admin Account</p>
                <h2>{account.name}</h2>
                <p>{account.role} at {account.workspace}</p>
              </div>
            </div>

            <div className="profile-meta-list">
              <div className="profile-meta-row">
                <span>Email</span>
                <strong>{account.email}</strong>
              </div>
              <div className="profile-meta-row">
                <span>Workspace</span>
                <strong>{account.workspace}</strong>
              </div>
              <div className="profile-meta-row">
                <span>Role</span>
                <strong>{account.role}</strong>
              </div>
              <div className="profile-meta-row">
                <span>Member Since</span>
                <strong>{account.memberSince}</strong>
              </div>
            </div>
          </article>
        </aside>

        <section className="profile-editor">
          <section className="profile-section-grid">
            <article className="profile-section-card">
              <div className="report-card-header">
                <p className="panel-kicker">Manage Email</p>
                <h2 className="report-title">Email Settings</h2>
                <p className="report-card-text">
                  Keep the main sign-in email current and verify changes with your password.
                </p>
              </div>

              <form className="profile-form" onSubmit={handleEmailSubmit}>
                <div className="form-grid">
                  <label className="form-field form-field--full">
                    Email Address
                    <input
                      type="email"
                      value={emailForm.email}
                      onChange={(event) => {
                        setEmailForm((current) => ({ ...current, email: event.target.value }))
                        setEmailFeedback(null)
                      }}
                      required
                    />
                  </label>

                  <label className="form-field form-field--full">
                    Current Password
                    <PasswordInput
                      value={emailForm.currentPassword}
                      onChange={(event) => {
                        setEmailForm((current) => ({
                          ...current,
                          currentPassword: event.target.value,
                        }))
                        setEmailFeedback(null)
                      }}
                      placeholder="Enter your current password"
                      showPassword={passwordVisibility.emailCurrent}
                      onToggle={() => togglePasswordVisibility('emailCurrent')}
                    />
                  </label>
                </div>

                {emailFeedback ? (
                  <p
                    className={
                      emailFeedback.tone === 'success'
                        ? 'form-feedback form-feedback-success'
                        : 'form-feedback form-feedback-error'
                    }
                  >
                    {emailFeedback.message}
                  </p>
                ) : null}

                <div className="profile-form-actions">
                  <button type="submit" className="primary-button">
                    Update Email
                  </button>
                </div>
              </form>
            </article>

            <article className="profile-section-card">
              <div className="report-card-header">
                <p className="panel-kicker">Manage Password</p>
                <h2 className="report-title">Password Settings</h2>
                <p className="report-card-text">
                  Set a fresh password while keeping the confirmation step clear and simple.
                </p>
              </div>

              <form className="profile-form" onSubmit={handlePasswordSubmit}>
                <div className="form-grid">
                  <label className="form-field form-field--full">
                    Current Password
                    <PasswordInput
                      value={passwordForm.currentPassword}
                      onChange={(event) => {
                        setPasswordForm((current) => ({
                          ...current,
                          currentPassword: event.target.value,
                        }))
                        setPasswordFeedback(null)
                      }}
                      placeholder="Enter your current password"
                      showPassword={passwordVisibility.passwordCurrent}
                      onToggle={() => togglePasswordVisibility('passwordCurrent')}
                    />
                  </label>

                  <label className="form-field">
                    New Password
                    <PasswordInput
                      value={passwordForm.nextPassword}
                      onChange={(event) => {
                        setPasswordForm((current) => ({ ...current, nextPassword: event.target.value }))
                        setPasswordFeedback(null)
                      }}
                      placeholder="Enter a new password"
                      showPassword={passwordVisibility.passwordNext}
                      onToggle={() => togglePasswordVisibility('passwordNext')}
                    />
                  </label>

                  <label className="form-field">
                    Confirm Password
                    <PasswordInput
                      value={passwordForm.confirmPassword}
                      onChange={(event) => {
                        setPasswordForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                        setPasswordFeedback(null)
                      }}
                      placeholder="Confirm the new password"
                      showPassword={passwordVisibility.passwordConfirm}
                      onToggle={() => togglePasswordVisibility('passwordConfirm')}
                    />
                  </label>
                </div>

                {passwordFeedback ? (
                  <p
                    className={
                      passwordFeedback.tone === 'success'
                        ? 'form-feedback form-feedback-success'
                        : 'form-feedback form-feedback-error'
                    }
                  >
                    {passwordFeedback.message}
                  </p>
                ) : null}

                <div className="profile-form-actions">
                  <button type="submit" className="primary-button">
                    Update Password
                  </button>
                </div>
              </form>
            </article>
          </section>
        </section>
      </section>
    </section>
  )
}

function ProductImage({ name, imageUrl }) {
  if (imageUrl) {
    return (
      <div className="product-artwork">
        <img src={imageUrl} alt={name} />
      </div>
    )
  }

  return <div className="product-artwork product-artwork--placeholder">Image</div>
}

function ProductModal({
  mode,
  formValues,
  onChange,
  onImageSelect,
  onImageRemove,
  onClose,
  onSubmit,
  isImageLoading,
  isSaving,
}) {
  const isEditMode = mode === 'edit'
  const categoryOptions = getDropdownOptions(PRODUCT_CATEGORY_OPTIONS, formValues.category)
  const unitOptions = getDropdownOptions(PRODUCT_UNIT_OPTIONS, formValues.unit)

  return (
    <div className="modal-backdrop">
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <div className="modal-header">
          <div>
            <p className="panel-kicker">Inventory</p>
            <h2 id="product-modal-title" className="modal-title">
              {isEditMode ? 'Update Product' : 'Add Product'}
            </h2>
            <p className="modal-description">
              {isEditMode
                ? 'Update the selected coffee shop inventory item.'
                : 'Add a new coffee shop product or supply item.'}
            </p>
          </div>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <div className="form-grid">
            <label className="form-field">
              Product Name
              <input
                type="text"
                value={formValues.name}
                onChange={(event) => onChange('name', event.target.value)}
                required
              />
            </label>

            <label className="form-field">
              Category
              <select
                value={formValues.category}
                onChange={(event) => onChange('category', event.target.value)}
                required
              >
                <option value="" disabled>
                  Select a category
                </option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              Unit
              <select
                value={formValues.unit}
                onChange={(event) => onChange('unit', event.target.value)}
                required
              >
                <option value="" disabled>
                  Select a unit
                </option>
                {unitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              Quantity
              <input
                type="number"
                min="0"
                value={formValues.items}
                onChange={(event) => onChange('items', event.target.value)}
                required
              />
            </label>

            <div className="form-field form-field--full">
              <span>Product Image</span>
              <div className="image-upload-field">
                <label className="file-input-button" htmlFor="product-image-upload">
                  <input
                    id="product-image-upload"
                    className="file-input"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
                      onImageSelect(file)
                      event.target.value = ''
                    }}
                  />
                  {formValues.imageUrl ? 'Replace Image' : 'Upload Image'}
                </label>

                <div className="image-upload-copy">
                  <strong>{isImageLoading ? 'Reading image...' : formValues.imageName || 'No image selected'}</strong>
                  <span>Use JPG, PNG, or WEBP files from your device.</span>
                </div>

                {formValues.imageUrl ? (
                  <button
                    type="button"
                    className="secondary-button secondary-button-muted"
                    onClick={onImageRemove}
                  >
                    Remove Image
                  </button>
                ) : null}
              </div>

              {formValues.imageUrl ? (
                <div className="image-upload-preview">
                  <ProductImage name={formValues.name || 'Product image'} imageUrl={formValues.imageUrl} />
                </div>
              ) : null}
            </div>

            <label className="form-field form-field--full">
              Description
              <textarea
                rows="4"
                value={formValues.description}
                onChange={(event) => onChange('description', event.target.value)}
                required
              />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={isImageLoading || isSaving}>
              {isImageLoading ? 'Uploading Image...' : isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function DeleteModal({ product, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop">
      <section className="modal-card modal-card--compact" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
        <div className="modal-header">
          <div>
            <p className="panel-kicker">Inventory</p>
            <h2 id="delete-modal-title" className="modal-title">
              Delete Product
            </h2>
            <p className="modal-description">
              Remove <strong>{product.name}</strong> from the coffee shop inventory?
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger-button" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </section>
    </div>
  )
}

function ProductDetailsModal({ product, onClose }) {
  const status = getStockStatus(product.items)

  return (
    <div className="modal-backdrop">
      <section
        className="modal-card modal-card--details"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-details-title"
      >
        <div className="modal-header details-header">
          <div className="details-header-copy">
            <p className="panel-kicker">Inventory</p>
            <h2 id="product-details-title" className="modal-title">
              {product.name}
            </h2>
            <p className="modal-description">
              A focused view of the product, its stock position, and the latest recorded update.
            </p>
          </div>
          <span className={getStockStatusClass(status)}>{status}</span>
        </div>

        <div className="details-shell">
          <section className="details-hero">
            <div className="details-media">
              <div className="details-media-frame">
                <ProductImage name={product.name} imageUrl={product.imageUrl} />
              </div>
            </div>

            <div className="details-summary">
              <div className="details-pill-row">
                <span className="details-pill">Category: {product.category}</span>
                <span className="details-pill">Unit: {product.unit}</span>
              </div>

              <article className="details-highlight">
                <span className="details-section-label">Current Stock</span>
                <strong>{formatStockQuantity(product.items, product.unit)}</strong>
                <p>{getStockStatusNote(status)}</p>
              </article>

              <article className="details-update-card">
                <span className="details-section-label">Latest Update</span>
                <p>{product.updates}</p>
              </article>
            </div>
          </section>

          <section className="details-section-grid">
            <article className="details-section details-section--description">
              <span className="details-section-label">Description</span>
              <p>{product.description}</p>
            </article>

            <article className="details-section">
              <span className="details-section-label">Product Snapshot</span>
              <div className="details-list">
                <div className="details-list-row">
                  <strong>Category</strong>
                  <span>{product.category}</span>
                </div>
                <div className="details-list-row">
                  <strong>Unit</strong>
                  <span>{product.unit}</span>
                </div>
                <div className="details-list-row">
                  <strong>Quantity</strong>
                  <span>{formatStockQuantity(product.items, product.unit)}</span>
                </div>
                <div className="details-list-row">
                  <strong>Status</strong>
                  <span className="details-list-status">
                    <span className={getStockStatusClass(status)}>{status}</span>
                  </span>
                </div>
              </div>
            </article>
          </section>
        </div>

        <div className="modal-actions details-close-bar">
          <button type="button" className="primary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  )
}

export default App
