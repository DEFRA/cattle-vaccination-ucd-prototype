//
// Fixed routes for v1-0 prototype
// Focus: preparation + doing journey
//
// Conventions used in this file:
// - GET routes render a page
// - POST routes process form input, update session data and then redirect
// - Session data is used to carry answers through the prototype journey
// - Prototype data and search behaviour are stubbed for now
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

//
// Stub herd / cattle search data
// Used by the prepare list journey when a user searches by CPH or animal ID
//
const herdData = {
  '12/345/6789': {
    label: '12/345/6789 — Hill Farm',
    cph: '12/345/6789',
    farm: 'Hill Farm',
    address: 'Hill Farm, York, YO1 1AA',
    cattle: '120',
    tb: '12 December 2025'
  },
  '12/345/6789-UK123456001': {
    label: '12/345/6789 — Hill Farm — UK123456/001',
    cph: '12/345/6789',
    farm: 'Hill Farm',
    address: 'Hill Farm, York, YO1 1AA',
    cattle: '1 selected animal',
    tb: '12 December 2025'
  },
  '98/765/4321': {
    label: '98/765/4321 — Moor Farm',
    cph: '98/765/4321',
    farm: 'Moor Farm',
    address: 'Moor Farm, Leeds, LS1 1AA',
    cattle: '85',
    tb: '3 January 2026'
  }
}

//
// ============================================================================
// Sign in
// ============================================================================
// Purpose:
// - Entry point for the prototype
// - Captures user email in session
// Notes:
// - Authentication is prototype-only
// - Validation is intentionally minimal
//

// GET /v1-0/sign-in
// Show the sign-in page
router.get('/v1-0/sign-in', function (req, res) {
  res.render('v1-0/sign-in')
})

// POST /v1-0/sign-in
// Capture sign-in details and send user to dashboard
// Session:
// - req.session.data.email
router.post('/v1-0/sign-in', function (req, res) {
  const email = req.body.email
  const password = req.body.password

  if (!email || !password) {
    return res.render('v1-0/sign-in', {
      error: 'Enter your email and password'
    })
  }

  req.session.data.email = email
  res.redirect('/v1-0/dashboard')
})

//
// ============================================================================
// Dashboard and work orders
// ============================================================================
// Purpose:
// - Dashboard is the main landing page after sign-in
// - Work order pages support the doing journey
//

// GET /v1-0/dashboard
// Show the main dashboard with links into prototype journeys
router.get('/v1-0/dashboard', function (req, res) {
  res.render('v1-0/dashboard')
})

// GET /v1-0/workorder-list
// Show table of open work orders
router.get('/v1-0/workorder-list', function (req, res) {
  res.render('v1-0/workorder-list')
})

// GET /v1-0/workorder-tasks
// Show task-list style page for an individual work order
// Includes:
// - Schedule vaccination
// - Prepare a list to take to a farm
// - Report vaccination (placeholder)
// - Report not vaccinated (placeholder)
router.get('/v1-0/workorder-tasks', function (req, res) {
  res.render('v1-0/workorder-tasks')
})

//
// ============================================================================
// Schedule vaccination
// ============================================================================
// Purpose:
// - Allow user to record a vaccination date for the work order
// Session:
// - vaccinationDateDay
// - vaccinationDateMonth
// - vaccinationDateYear
//

// GET /v1-0/schedule-vaccination
// Show vaccination date form
router.get('/v1-0/schedule-vaccination', function (req, res) {
  res.render('v1-0/schedule-vaccination')
})

// POST /v1-0/schedule-vaccination
// Save entered vaccination date and continue to confirmation
router.post('/v1-0/schedule-vaccination', function (req, res) {
  req.session.data.vaccinationDateDay = req.body.vaccinationDateDay
  req.session.data.vaccinationDateMonth = req.body.vaccinationDateMonth
  req.session.data.vaccinationDateYear = req.body.vaccinationDateYear

  res.redirect('/v1-0/schedule-vaccination-confirmation')
})

// GET /v1-0/schedule-vaccination-confirmation
// Show confirmation page after scheduling vaccination
router.get('/v1-0/schedule-vaccination-confirmation', function (req, res) {
  res.render('v1-0/schedule-vaccination-confirmation')
})

//
// ============================================================================
// Prepare list journey
// ============================================================================
// Journey:
// prepare-list-for
// -> choose-cattle
// -> choose-cattle-results
// -> herd-details
// -> prepare-list-download
// -> customise-list
// -> check-list
// -> download-list
//

// GET /v1-0/prepare-list-for
// Show first page of the prepare list journey
router.get('/v1-0/prepare-list-for', function (req, res) {
  res.render('v1-0/prepare-list-for')
})

// POST /v1-0/choose-cattle
// Save what kind of list the user wants to prepare
// Session:
// - req.session.data.listType
// Redirect:
// - /v1-0/choose-cattle
router.post('/v1-0/choose-cattle', function (req, res) {
  req.session.data.listType = req.body.listType
  res.redirect('/v1-0/choose-cattle')
})

// GET /v1-0/choose-cattle
// Show search page for herd / cattle lookup
router.get('/v1-0/choose-cattle', function (req, res) {
  res.render('v1-0/choose-cattle')
})

//
// Search for herd or cattle
// Behaviour:
// - Prototype search uses simple includes() matching
// - Results are stored in session for the results page
//

// POST /v1-0/herd-results
// Process search term and create filtered results list
// Session:
// - req.session.data.cattleSearch
// - req.session.data.searchResults
// Redirect:
// - /v1-0/choose-cattle-results
router.post('/v1-0/herd-results', function (req, res) {
  const search = (req.body.cattleSearch || '').toLowerCase().trim()

  const allResults = [
    { value: '12/345/6789', text: '12/345/6789 — Hill Farm' },
    { value: '12/345/6789-UK123456001', text: '12/345/6789 — Hill Farm — UK123456/001' },
    { value: '98/765/4321', text: '98/765/4321 — Moor Farm' }
  ]

  const results = allResults.filter(item =>
    item.text.toLowerCase().includes(search) ||
    item.value.toLowerCase().includes(search)
  )

  req.session.data.cattleSearch = req.body.cattleSearch
  req.session.data.searchResults = results

  res.redirect('/v1-0/choose-cattle-results')
})

// GET /v1-0/choose-cattle-results
// Show filtered herd / cattle search results
router.get('/v1-0/choose-cattle-results', function (req, res) {
  res.render('v1-0/choose-cattle-results')
})

// POST /v1-0/herd-details
// Save selected herd or animal and show herd details page
// Session:
// - req.session.data.selectedCattle
// - req.session.data.herd
// - req.session.data.selectedCattleLabel
// Notes:
// - selectedCattleLabel falls back to raw submitted value if lookup fails
router.post('/v1-0/herd-details', function (req, res) {
  const selected = req.body.selectedCattle
  const selectedHerd = herdData[selected]

  req.session.data.selectedCattle = selected
  req.session.data.herd = selectedHerd
  req.session.data.selectedCattleLabel = selectedHerd ? selectedHerd.label : selected

  res.render('v1-0/herd-details')
})

// GET /v1-0/herd-details
// Show herd details using selected session data
router.get('/v1-0/herd-details', function (req, res) {
  res.render('v1-0/herd-details')
})

//
// ============================================================================
// Download and customise list
// ============================================================================
// Purpose:
// - Let user choose format and fields for their list
// - Confirm selected options before download
// Notes:
// - Download is currently a prototype stub
//

// GET /v1-0/prepare-list-download
// Show page where user chooses whether to continue to download options
router.get('/v1-0/prepare-list-download', function (req, res) {
  res.render('v1-0/prepare-list-download')
})

// POST /v1-0/customise-list
// Save chosen download format
// Session:
// - req.session.data.downloadFormat
// Redirect:
// - /v1-0/customise-list
router.post('/v1-0/customise-list', function (req, res) {
  req.session.data.downloadFormat = req.body.downloadFormat
  res.redirect('/v1-0/customise-list')
})

// GET /v1-0/customise-list
// Show options for fields and sorting
router.get('/v1-0/customise-list', function (req, res) {
  res.render('v1-0/customise-list')
})

// POST /v1-0/check-list
// Save field selections and sort order, then continue to check answers
// Session:
// - req.session.data.fields
// - req.session.data.sortBy
// Notes:
// - fields may be submitted as a string or array, so normalise to array
router.post('/v1-0/check-list', function (req, res) {
  let fields = req.body.fields || []

  if (!Array.isArray(fields)) {
    fields = [fields]
  }

  req.session.data.fields = fields
  req.session.data.sortBy = req.body.sortBy

  res.redirect('/v1-0/check-list')
})

// GET /v1-0/check-list
// Show check answers summary before download
router.get('/v1-0/check-list', function (req, res) {
  res.render('v1-0/check-list')
})

// POST /v1-0/download-list
// Prototype submit step for download action
// Redirects to the download page
router.post('/v1-0/download-list', function (req, res) {
  res.redirect('/v1-0/download-list')
})

// GET /v1-0/download-list
// Show final download page
// Notes:
// - Download functionality is currently a fake / stubbed action
router.get('/v1-0/download-list', function (req, res) {
  res.render('v1-0/download-list')
})

module.exports = router