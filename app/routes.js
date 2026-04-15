const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// -----------------------------------------------------------------------------
// Herd data: 20 representative English cattle farms
// -----------------------------------------------------------------------------
const herdData = {
  '12/345/6789': { cph: '12/345/6789', farm: 'Hill Farm', address: 'Hill Farm, York, YO1 1AA', cattle: '244' },
  '12/345/6790': { cph: '12/345/6790', farm: 'Moor Farm', address: 'Moor Farm, Leeds, LS1 2AB', cattle: '58' },
  '12/345/6791': { cph: '12/345/6791', farm: 'Orchard Gate Farm', address: 'Orchard Gate Farm, Ripon, HG4 1BC', cattle: '132' },
  '12/345/6792': { cph: '12/345/6792', farm: 'Willow Bank Farm', address: 'Willow Bank Farm, Selby, YO8 4CD', cattle: '41' },
  '12/345/6793': { cph: '12/345/6793', farm: 'Red Barn Farm', address: 'Red Barn Farm, Thirsk, YO7 3DE', cattle: '173' },
  '12/345/6794': { cph: '12/345/6794', farm: 'Meadow View Farm', address: 'Meadow View Farm, Harrogate, HG1 5EF', cattle: '97' },
  '12/345/6795': { cph: '12/345/6795', farm: 'Low Beck Farm', address: 'Low Beck Farm, Malton, YO17 7FG', cattle: '326' },
  '12/345/6796': { cph: '12/345/6796', farm: 'West Field Farm', address: 'West Field Farm, Bedale, DL8 1GH', cattle: '119' },
  '12/345/6797': { cph: '12/345/6797', farm: 'Oak Tree Farm', address: 'Oak Tree Farm, Skipton, BD23 2HJ', cattle: '64' },
  '12/345/6798': { cph: '12/345/6798', farm: 'Stonebridge Farm', address: 'Stonebridge Farm, Beverley, HU17 8JK', cattle: '211' },
  '12/345/6799': { cph: '12/345/6799', farm: 'High Pastures Farm', address: 'High Pastures Farm, Northallerton, DL7 9KL', cattle: '387' },
  '12/345/6800': { cph: '12/345/6800', farm: 'Green Lane Farm', address: 'Green Lane Farm, Pocklington, YO42 1LM', cattle: '72' },
  '12/345/6801': { cph: '12/345/6801', farm: 'Sunnyside Farm', address: 'Sunnyside Farm, Driffield, YO25 6MN', cattle: '158' },
  '12/345/6802': { cph: '12/345/6802', farm: 'Mill House Farm', address: 'Mill House Farm, Richmond, DL10 4NP', cattle: '36' },
  '12/345/6803': { cph: '12/345/6803', farm: 'Hazelcroft Farm', address: 'Hazelcroft Farm, Helmsley, YO62 5PQ', cattle: '146' },
  '12/345/6804': { cph: '12/345/6804', farm: 'Birch Hollow Farm', address: 'Birch Hollow Farm, Otley, LS21 3QR', cattle: '421' },
  '12/345/6805': { cph: '12/345/6805', farm: 'Rosewood Farm', address: 'Rosewood Farm, Wetherby, LS22 6RS', cattle: '89' },
  '12/345/6806': { cph: '12/345/6806', farm: 'Brookside Farm', address: 'Brookside Farm, Easingwold, YO61 3ST', cattle: '184' },
  '12/345/6807': { cph: '12/345/6807', farm: 'Elm Carr Farm', address: 'Elm Carr Farm, Pickering, YO18 7TU', cattle: '267' },
  '12/345/6808': { cph: '12/345/6808', farm: 'Riverside Farm', address: 'Riverside Farm, Tadcaster, LS24 9UV', cattle: '512' }
}

function searchResultsForTerm(search) {
  const term = (search || '').toLowerCase()

  return Object.entries(herdData)
    .map(([value, herd]) => ({
      value,
      text: `${herd.cph}, ${herd.farm}`,
      html: `<strong>${herd.cph}, ${herd.farm}</strong>`,
      hint: {
        text: `${herd.address.replace(herd.farm + ', ', '')} – ${herd.cattle} cattle`
      }
    }))
    .filter(item =>
      item.text.toLowerCase().includes(term) ||
      item.value.toLowerCase().includes(term) ||
      item.hint.text.toLowerCase().includes(term)
    )
}

function renderSearchPage(req, res, pageName, errors) {
  return res.render(pageName, {
    errors,
    errorSummary: errors
      ? {
          titleText: 'There is a problem',
          errorList: Object.keys(errors).map((key) => ({
            text: errors[key].text,
            href: `#${key}`
          }))
        }
      : null
  })
}

function handleFarmSearch(req, res, pageName) {
  const searchInput = (req.body.cattleSearch || req.body.search || '').trim()

  req.session.data.cattleSearch = searchInput
  req.session.data.search = searchInput

  if (!searchInput) {
    return renderSearchPage(req, res, pageName, {
      cattleSearch: { text: 'Enter a CPH, farm name or postcode' }
    })
  }

  req.session.data.searchResults = searchResultsForTerm(searchInput)
  res.redirect('/v1-0/search-results')
}



function handleReportSearch(req, res, pageName) {
  const searchInput = (req.body.reportSearch || '').trim()

  req.session.data.reportSearch = searchInput

  if (!searchInput) {
    return renderSearchPage(req, res, pageName, {
      reportSearch: { text: 'Enter a CPH, farm name or ear tag' }
    })
  }

  req.session.data.reportSearchResults = searchResultsForTerm(searchInput)
  res.redirect('/v1-0/choose-a-herd-or-animal-to-report')
}
// -----------------------------------------------------------------------------
// Start and sign-in routes
// -----------------------------------------------------------------------------
router.get('/v1-0/sign-in', (req, res) => {
  res.render('v1-0/sign-in')
})

router.post('/v1-0/sign-in', (req, res) => {
  const signInMethod = req.body.signInMethod

  if (!signInMethod) {
    return res.render('v1-0/sign-in', {
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [
          {
            text: 'Select how you want to sign in',
            href: '#signInMethod'
          }
        ]
      },
      errors: {
        signInMethod: { text: 'Select how you want to sign in' }
      }
    })
  }

  if (signInMethod === 'one-login') {
    return res.redirect('/v1-0/one-login')
  }

  return res.redirect('/v1-0/dashboard')
})

// -----------------------------------------------------------------------------
// Search routes
// -----------------------------------------------------------------------------
router.get('/v1-0/search', (req, res) => {
  res.render('v1-0/search')
})

router.post('/v1-0/search', (req, res) => {
  handleFarmSearch(req, res, 'v1-0/search')
})

router.get('/v1-0/search-for-a-herd-or-animal', (req, res) => {
  res.render('v1-0/search-for-a-herd-or-animal')
})

router.post('/v1-0/search-for-a-herd-or-animal', (req, res) => {
  handleFarmSearch(req, res, 'v1-0/search-for-a-herd-or-animal')
})

router.get('/v1-0/search-results', (req, res) => {
  res.render('v1-0/search-results')
})

router.get('/v1-0/confirm-herd-or-animal', (req, res) => {
  res.render('v1-0/confirm-herd-or-animal')
})

router.post('/v1-0/confirm-herd-or-animal', (req, res) => {
  const selected = req.body.selectedCattle

  if (!selected) {
    return res.render('v1-0/search-results', {
      errors: {
        selectedCattle: { text: 'Select a farm' }
      },
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [
          {
            text: 'Select a farm',
            href: '#selectedCattle'
          }
        ]
      }
    })
  }

  req.session.data.selectedCattle = selected
  req.session.data.herd = herdData[selected]
  req.session.data.selectedCattleLabel = herdData[selected] ? `${herdData[selected].cph} — ${herdData[selected].farm}` : selected
  return res.redirect('/v1-0/confirm-herd-or-animal')
})



router.get('/v1-0/search-for-a-herd-or-animal-to-report', (req, res) => {
  res.render('v1-0/search-for-a-herd-or-animal-to-report')
})

router.post('/v1-0/search-for-a-herd-or-animal-to-report', (req, res) => {
  handleReportSearch(req, res, 'v1-0/search-for-a-herd-or-animal-to-report')
})

router.get('/v1-0/choose-a-herd-or-animal-to-report', (req, res) => {
  res.render('v1-0/choose-a-herd-or-animal-to-report')
})

router.get('/v1-0/confirm-herd-or-animal-to-report', (req, res) => {
  res.render('v1-0/confirm-herd-or-animal-to-report')
})

router.post('/v1-0/confirm-herd-or-animal-to-report', (req, res) => {
  const selected = req.body.selectedCattle

  if (!selected) {
    return res.render('v1-0/choose-a-herd-or-animal-to-report', {
      errors: {
        selectedCattle: { text: 'Select a herd or animal' }
      },
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [
          {
            text: 'Select a herd or animal',
            href: '#selectedCattle'
          }
        ]
      }
    })
  }

  req.session.data.selectedCattle = selected
  req.session.data.herd = herdData[selected]
  req.session.data.selectedCattleLabel = herdData[selected] ? `${herdData[selected].cph} — ${herdData[selected].farm}` : selected
  return res.redirect('/v1-0/confirm-herd-or-animal-to-report')
})

router.post('/v1-0/report-activity-type', (req, res) => {
  const reportType = req.body.reportType
  req.session.data.reportType = reportType

  if (!reportType) {
    return res.render('v1-0/confirm-herd-or-animal-to-report', {
      errors: {
        reportType: { text: 'Select what you want to report' }
      },
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [
          {
            text: 'Select what you want to report',
            href: '#reportType'
          }
        ]
      }
    })
  }

  if (reportType === 'vaccination' || reportType === 'both') {
    return res.redirect('/v1-0/who-gave-the-vaccine')
  }

  return res.redirect('/v1-0/report-summary')
})

router.post('/v1-0/who-gave-the-vaccine', (req, res) => {
  const administeredBy = req.body.administeredBy
  req.session.data.administeredBy = administeredBy
  req.session.data.firstName = req.body.firstName
  req.session.data.lastName = req.body.lastName
  req.session.data.theirRole = req.body.theirRole
  req.session.data.otherRole = req.body.otherRole

  if (!administeredBy) {
    return res.render('v1-0/who-gave-the-vaccine', {
      errors: {
        administeredBy: { text: 'Select who gave the vaccine' }
      },
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [{ text: 'Select who gave the vaccine', href: '#administeredBy' }]
      }
    })
  }

  return res.redirect('/v1-0/enter-vaccine-batch-details')
})

router.post('/v1-0/enter-vaccination-date', (req, res) => {
  req.session.data.vaccinationDateDay = req.body['vaccinationDate-day']
  req.session.data.vaccinationDateMonth = req.body['vaccinationDate-month']
  req.session.data.vaccinationDateYear = req.body['vaccinationDate-year']
  return res.redirect('/v1-0/enter-vaccine-batch-details')
})

router.post('/v1-0/enter-vaccine-batch-details', (req, res) => {
  req.session.data.batchNumber = req.body.batchNumber
  req.session.data.batchExpiryDateDay = req.body['batchExpiryDate-day']
  req.session.data.batchExpiryDateMonth = req.body['batchExpiryDate-month']
  req.session.data.batchExpiryDateYear = req.body['batchExpiryDate-year']
  return res.redirect('/v1-0/enter-diluent-batch-details')
})

router.get('/v1-0/enter-diluent-batch-details', (req, res) => {
  res.render('v1-0/enter-diluent-batch-details')
})

router.post('/v1-0/enter-diluent-batch-details', (req, res) => {
  req.session.data.diluentBatchNumber = req.body.diluentBatchNumber
  req.session.data.diluentBatchExpiryDateDay = req.body['diluentBatchExpiryDate-day']
  req.session.data.diluentBatchExpiryDateMonth = req.body['diluentBatchExpiryDate-month']
  req.session.data.diluentBatchExpiryDateYear = req.body['diluentBatchExpiryDate-year']
  return res.redirect('/v1-0/select-vaccinated-animals')
})

router.get('/v1-0/select-vaccinated-animals', (req, res) => {
  req.session.data.markingPhase = req.session.data.markingPhase || 'vaccinated'
  req.session.data.activeReviewGroup = req.session.data.activeReviewGroup || 'remaining'
  return renderSelectVaccinatedAnimals(req, res)
})

router.post('/v1-0/select-vaccinated-animals', (req, res) => {
  const animals = getReportingAnimals(req)
  const lookup = getAnimalLookup(animals)
  const selectedIds = Array.isArray(req.body.selectedAnimals)
    ? req.body.selectedAnimals
    : (req.body.selectedAnimals ? [req.body.selectedAnimals] : [])
  const markAction = req.body.markAction
  const selectedStatus = req.body.selectedStatus
  const otherReason = (req.body.otherReason || '').trim()

  req.session.data.markingPhase = req.session.data.markingPhase || 'vaccinated'
  req.session.data.activeReviewGroup = req.session.data.activeReviewGroup || 'remaining'

  if (markAction === 'view-group') {
    req.session.data.activeReviewGroup = req.body.reviewGroup || 'remaining'
    return res.redirect('/v1-0/select-vaccinated-animals')
  }

  if (markAction === 'continue-to-reasons') {
    req.session.data.markingPhase = 'reasons'
    req.session.data.activeReviewGroup = 'remaining'
    return res.redirect('/v1-0/select-vaccinated-animals')
  }

  if (markAction === 'continue') {
    const decisionMap = getDecisionMap(req.session.data)
    const groups = getReportingGroups(animals, decisionMap)

    if (groups.remaining.length) {
      return renderSelectVaccinatedAnimals(req, res, {
        errors: {
          selectedAnimals: { text: 'Mark all remaining cattle before you continue' }
        },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [
            {
              text: 'Mark all remaining cattle before you continue',
              href: '#selected-animals'
            }
          ]
        }
      })
    }

    req.session.data.vaccinatedCattle = groups.vaccinated.map(animal => animal.officialId)
    const otherReasons = req.session.data.otherReasons || {}
    req.session.data.remainingCattleUpdates = [
      { status: 'not-found', cattle: groups['not-found'].map(animal => animal.officialId) },
      { status: 'deceased', cattle: groups.deceased.map(animal => animal.officialId) },
      { status: 'withdrawn-export', cattle: groups['withdrawn-export'].map(animal => animal.officialId) },
      { status: 'withdrawn-slaughter', cattle: groups['withdrawn-slaughter'].map(animal => animal.officialId) },
      { status: 'withdrawn-owner', cattle: groups['withdrawn-owner'].map(animal => animal.officialId) },
      {
        status: 'other',
        cattle: groups.other.map(animal => animal.officialId),
        reasons: groups.other.reduce((acc, animal) => {
          if (otherReasons[animal.officialId]) {
            acc[animal.officialId] = otherReasons[animal.officialId]
          }
          return acc
        }, {})
      }
    ].filter(group => group.cattle.length)

    return res.redirect('/v1-0/check-report-answers')
  }

  if (markAction === 'reset') {
    const decisionMap = { ...getDecisionMap(req.session.data) }
    const otherReasons = { ...(req.session.data.otherReasons || {}) }
    selectedIds.forEach(id => {
      delete decisionMap[id]
      delete otherReasons[id]
    })
    req.session.data.cattleDecisions = decisionMap
    req.session.data.otherReasons = otherReasons
    req.session.data.activeReviewGroup = 'remaining'
    return res.redirect('/v1-0/select-vaccinated-animals')
  }

  if (!selectedIds.length) {
    return renderSelectVaccinatedAnimals(req, res, {
      selectedIds,
      formValues: { selectedStatus, otherReason },
      errors: {
        selectedAnimals: { text: 'Select at least one animal' }
      },
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [
          {
            text: 'Select at least one animal',
            href: '#selected-animals'
          }
        ]
      }
    })
  }

  if (markAction !== 'mark') {
    return res.redirect('/v1-0/select-vaccinated-animals')
  }

  const finalStatus = req.session.data.markingPhase === 'vaccinated'
    ? 'vaccinated'
    : selectedStatus

  if (req.session.data.markingPhase === 'reasons' && !selectedStatus) {
    return renderSelectVaccinatedAnimals(req, res, {
      selectedIds,
      formValues: { selectedStatus, otherReason },
      errors: {
        selectedStatus: { text: 'Select what to mark the selected cattle as' }
      },
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [
          {
            text: 'Select what to mark the selected cattle as',
            href: '#selectedStatus'
          }
        ]
      }
    })
  }

  if (finalStatus === 'other' && !otherReason) {
    return renderSelectVaccinatedAnimals(req, res, {
      selectedIds,
      formValues: { selectedStatus, otherReason },
      errors: {
        otherReason: { text: 'Enter the other reason' }
      },
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [
          {
            text: 'Enter the other reason',
            href: '#otherReason'
          }
        ]
      }
    })
  }

  const decisionMap = { ...getDecisionMap(req.session.data) }
  const otherReasons = { ...(req.session.data.otherReasons || {}) }

  selectedIds.forEach(id => {
    if (lookup[id]) {
      decisionMap[id] = finalStatus

      if (finalStatus === 'other') {
        otherReasons[id] = otherReason
      } else {
        delete otherReasons[id]
      }
    }
  })

  req.session.data.cattleDecisions = decisionMap
  req.session.data.otherReasons = otherReasons
  req.session.data.activeReviewGroup = 'remaining'
  return res.redirect('/v1-0/select-vaccinated-animals')
})

router.post('/v1-0/add-a-note', (req, res) => {
  req.session.data.vaccinationNote = req.body.vaccinationNote
  return res.redirect('/v1-0/check-report-answers')
})

router.post('/v1-0/submit-vaccination-report', (req, res) => {
  return res.redirect('/v1-0/report-submitted')
})

// One Login
router.get('/v1-0/one-login', function (req, res) {
  res.render('v1-0/one-login')
})

router.get('/v1-0/one-login-email', function (req, res) {
  res.render('v1-0/one-login-email', { error: null })
})

router.post('/v1-0/one-login-email', function (req, res) {
  const email = (req.body.email || '').trim()
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  req.session.data.email = email

  if (!email) {
    return res.render('v1-0/one-login-email', {
      error: 'Enter your email address'
    })
  }

  if (!emailPattern.test(email)) {
    return res.render('v1-0/one-login-email', {
      error: 'Enter an email address in the correct format, like name@example.com'
    })
  }

  res.redirect('/v1-0/one-login-password')
})

router.get('/v1-0/one-login-password', function (req, res) {
  res.render('v1-0/one-login-password')
})

router.post('/v1-0/one-login-password', function (req, res) {
  const password = (req.body.password || '').trim()

  req.session.data.password = password

  if (!password) {
    return res.render('v1-0/one-login-password', {
      error: 'Enter your password'
    })
  }

  req.session.data.userName = 'Alex Taylor'
  res.redirect('/v1-0/dashboard')
})


// -----------------------------------------------------------------------------
// Download list preview data and helpers
// -----------------------------------------------------------------------------
const baseAnimalData = {
  '12/345/6789': [
    {
      officialId: 'UK341234412177',
      earTagNumber: 'UK341234412177',
      barcode: 'UK341234412177',
      breed: 'Holstein Friesian',
      dob: '06/12/2022',
      age: 28,
      sex: 'Female',
      vaccinationStatus: 'Vaccinated',
      notes: 'Duplicate'
    },
    {
      officialId: 'UK341123302177',
      earTagNumber: 'UK341123302177',
      barcode: 'UK341123302177',
      breed: 'British Friesian',
      dob: '06/12/2024',
      age: 4,
      sex: 'Female',
      vaccinationStatus: 'Not vaccinated',
      notes: 'NO Gamma'
    },
    {
      officialId: 'UK341567812199',
      earTagNumber: 'UK341567812199',
      barcode: 'UK341567812199',
      breed: 'Angus Cross',
      dob: '13/03/2023',
      age: 25,
      sex: 'Male',
      vaccinationStatus: 'Vaccinated',
      notes: ''
    }
  ],
  '12/345/6790': [
    {
      officialId: 'UK120900112301',
      earTagNumber: 'UK120900112301',
      barcode: 'UK120900112301',
      breed: 'Limousin',
      dob: '02/02/2023',
      age: 26,
      sex: 'Female',
      vaccinationStatus: 'Vaccinated',
      notes: ''
    },
    {
      officialId: 'UK120900112302',
      earTagNumber: 'UK120900112302',
      barcode: 'UK120900112302',
      breed: 'Charolais',
      dob: '19/08/2024',
      age: 8,
      sex: 'Male',
      vaccinationStatus: 'Not vaccinated',
      notes: ''
    }
  ]
}

const herdTagConfig = {
  '12/345/6789': { herdMark: '341234', checkDigit: '4' },
  '12/345/6790': { herdMark: '120900', checkDigit: '1' },
  '12/345/6792': { herdMark: '123456', checkDigit: '7' },
  '12/345/6808': { herdMark: '183483', checkDigit: '7' }
}

const availableListColumns = ['Age', 'DOB', 'Sex', 'Breed', 'Vaccination status']

function formatDateForOffset(monthOffset, day) {
  const date = new Date(Date.UTC(2026, 3, 14))
  date.setUTCMonth(date.getUTCMonth() - monthOffset)
  date.setUTCDate(day)

  const dd = String(date.getUTCDate()).padStart(2, '0')
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = date.getUTCFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function createGeneratedAnimal(cph, index) {
  const fallbackDigits = String(cph || '').replace(/\D/g, '')
  const config = herdTagConfig[cph] || {
    herdMark: (fallbackDigits.slice(0, 6) || '123456').padEnd(6, '0'),
    checkDigit: fallbackDigits.slice(6, 7) || '1'
  }
  const breeds = ['Holstein Friesian', 'British Friesian', 'Angus Cross', 'Limousin', 'Charolais']
  const sex = index % 5 === 0 ? 'Male' : 'Female'
  const age = 4 + (index % 32)
  const vaccinationStatus = index % 4 === 0 ? 'Not vaccinated' : 'Vaccinated'
  const individual = String(index + 1).padStart(5, '0')
  const officialId = `UK${config.herdMark}${config.checkDigit}${individual}`

  return {
    officialId,
    earTagNumber: officialId,
    barcode: officialId,
    breed: breeds[index % breeds.length],
    dob: formatDateForOffset(age, (index % 28) + 1),
    age,
    sex,
    vaccinationStatus,
    notes: ''
  }
}

function getAnimalsForSelection(selectedCattle) {
  const herd = herdData[selectedCattle] || herdData['12/345/6789']
  const cattleCount = Number(herd.cattle) || 0
  const seedAnimals = baseAnimalData[selectedCattle] || []

  return Array.from({ length: cattleCount }, function (_, index) {
    if (seedAnimals[index]) {
      return seedAnimals[index]
    }

    return createGeneratedAnimal(selectedCattle || herd.cph, index)
  })
}

function normaliseFields(fields) {
  let selectedFields = fields || []

  if (!Array.isArray(selectedFields)) {
    selectedFields = [selectedFields]
  }

  return selectedFields.filter(field => field && field !== '_unchecked')
}

function getSortValue(animal, sortBy) {
  switch (sortBy) {
    case 'Age':
    case 'Age (youngest to oldest)':
      return animal.age
    case 'Vaccination status':
      return animal.vaccinationStatus || ''
    case 'Ear-tag number':
      return animal.earTagNumber || ''
    case 'Sex':
      return animal.sex || ''
    case 'Breed':
      return animal.breed || ''
    case 'DOB':
      return animal.dob || ''
    default:
      return animal.earTagNumber || ''
  }
}

function sortAnimals(animals, sortBy, sortDirection) {
  const direction = sortDirection === 'desc' ? -1 : 1

  return [...animals].sort((a, b) => {
    const aValue = getSortValue(a, sortBy)
    const bValue = getSortValue(b, sortBy)

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * direction
    }

    return String(aValue).localeCompare(String(bValue)) * direction
  })
}

function getFieldValue(animal, field) {
  switch (field) {
    case 'Age':
    case 'Age (youngest to oldest)':
      return `${animal.age} months`
    case 'Vaccination status':
      return ''
    case 'Ear-tag number':
      return animal.earTagNumber || ''
    case 'Sex':
      return animal.sex || ''
    case 'Breed':
      return animal.breed || ''
    case 'DOB':
      return animal.dob || ''
    default:
      return ''
  }
}

function orderPreviewFields(fields) {
  const selectedFields = normaliseFields(fields).filter(field => field !== 'Ear-tag number')
  const ordered = availableListColumns.filter(field => selectedFields.includes(field))
  const vaccinationField = ordered.find(field => field === 'Vaccination status')
  const remainingFields = ordered.filter(field => field !== 'Vaccination status')

  return vaccinationField ? [...remainingFields, vaccinationField] : remainingFields
}

function buildPreviewColumns(fields) {
  return orderPreviewFields(fields)
}

function formatEarTagParts(officialId) {
  const cleaned = String(officialId || '').replace(/\s+/g, '').replace(/^UK/i, '')

  return {
    prefix: 'UK',
    herd: cleaned.slice(0, 6),
    check: cleaned.slice(6, 7),
    individual: cleaned.slice(7, 12)
  }
}

function buildPreviewRows(animals, fields) {
  const selectedFields = orderPreviewFields(fields)

  return animals.map(animal => ({
    officialId: animal.officialId,
    barcode: animal.barcode,
    notes: animal.notes,
    earTagParts: formatEarTagParts(animal.officialId),
    cells: selectedFields.map(field => ({
      key: field,
      value: getFieldValue(animal, field)
    }))
  }))
}

function normalisePreviewOptions(options, fields) {
  const allFields = availableListColumns
  const submitted = Array.isArray(options) ? options : (options ? [options] : [])
  const filtered = submitted.filter(option => option && option !== '_unchecked')

  if (!filtered.length) {
    return ['show-last-five', ...allFields]
  }

  return filtered
}

function getPreviewSettings(sessionData, fields) {
  const allFields = availableListColumns
  const previewOptions = normalisePreviewOptions(sessionData.previewOptions, fields)
  const visibleColumns = allFields.filter(field => previewOptions.includes(field))

  return {
    previewTextSize: sessionData.previewTextSize || 'standard',
    previewOrientation: sessionData.previewOrientation || 'portrait',
    previewSpacing: sessionData.previewSpacing || 'standard',
    previewOptions,
    emphasiseLastFive: previewOptions.includes('show-last-five'),
    visibleColumns,
    allColumns: allFields
  }
}



function getReportingAnimals(req) {
  const selectedCattle = req.session.data.selectedCattle
  const sortBy = req.session.data.sortBy || 'Ear-tag number'
  const sortDirection = req.session.data.sortDirection || 'asc'
  return sortAnimals(getAnimalsForSelection(selectedCattle), sortBy, sortDirection)
}

function getAnimalLookup(animals) {
  return animals.reduce((lookup, animal) => {
    lookup[animal.officialId] = animal
    return lookup
  }, {})
}

function getDecisionMap(sessionData) {
  return sessionData.cattleDecisions || {}
}

function getReportingGroups(animals, decisionMap) {
  const groups = {
    remaining: [],
    vaccinated: [],
    'not-found': [],
    deceased: [],
    'withdrawn-export': [],
    'withdrawn-slaughter': [],
    'withdrawn-owner': [],
    other: []
  }

  animals.forEach((animal) => {
    const decision = decisionMap[animal.officialId]

    if (decision && groups[decision]) {
      groups[decision].push(animal)
    } else {
      groups.remaining.push(animal)
    }
  })

  return groups
}



function getSummaryBuckets(groups) {
  return [
    { key: 'vaccinated', label: 'Vaccinated', count: groups.vaccinated.length },
    { key: 'not-found', label: 'Cattle not found', count: groups['not-found'].length },
    { key: 'deceased', label: 'Deceased', count: groups.deceased.length },
    { key: 'withdrawn-export', label: 'Withdrawn for export', count: groups['withdrawn-export'].length },
    { key: 'withdrawn-slaughter', label: 'Withdrawn for slaughter', count: groups['withdrawn-slaughter'].length },
    { key: 'withdrawn-owner', label: 'Withdrawn by owner', count: groups['withdrawn-owner'].length },
    { key: 'other', label: 'Other', count: groups.other.length }
  ].filter(bucket => bucket.count > 0)
}

function getGroupLabel(groupKey) {
  const labels = {
    remaining: 'Remaining cattle',
    vaccinated: 'Vaccinated',
    'not-found': 'Cattle not found',
    deceased: 'Deceased',
    'withdrawn-export': 'Withdrawn for export',
    'withdrawn-slaughter': 'Withdrawn for slaughter',
    'withdrawn-owner': 'Withdrawn by owner',
    other: 'Other'
  }

  return labels[groupKey] || 'Remaining cattle'
}

function getRowsForReviewGroup(groups, groupKey, otherReasons) {
  switch (groupKey) {
    case 'vaccinated':
      return buildReportingTableRows(groups.vaccinated, otherReasons)
    case 'not-found':
      return buildReportingTableRows(groups['not-found'], otherReasons)
    case 'deceased':
      return buildReportingTableRows(groups.deceased, otherReasons)
    case 'withdrawn-export':
      return buildReportingTableRows(groups['withdrawn-export'], otherReasons)
    case 'withdrawn-slaughter':
      return buildReportingTableRows(groups['withdrawn-slaughter'], otherReasons)
    case 'withdrawn-owner':
      return buildReportingTableRows(groups['withdrawn-owner'], otherReasons)
    case 'other':
      return buildReportingTableRows(groups.other, otherReasons)
    default:
      return buildReportingTableRows(groups.remaining, otherReasons)
  }
}

function calculateAgeFromDob(dob) {
  if (!dob || typeof dob !== 'string') {
    return ''
  }

  const parts = dob.split('/')
  if (parts.length !== 3) {
    return ''
  }

  const [day, month, year] = parts.map(Number)
  const birthDate = new Date(year, month - 1, day)

  if (Number.isNaN(birthDate.getTime())) {
    return ''
  }

  const today = new Date()
  let years = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    years -= 1
  }

  if (years < 1) {
    const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + today.getMonth() - birthDate.getMonth() - (today.getDate() < birthDate.getDate() ? 1 : 0)
    const safeMonths = Math.max(months, 0)
    return `${safeMonths} ${safeMonths === 1 ? 'month' : 'months'}`
  }

  return `${years} ${years === 1 ? 'year' : 'years'}`
}

function buildReportingTableRows(animals, otherReasons = {}) {
  return animals.map(animal => ({
    id: animal.officialId,
    officialId: animal.officialId,
    age: calculateAgeFromDob(animal.dob),
    breed: animal.breed,
    dob: animal.dob,
    sex: animal.sex,
    notes: animal.notes,
    otherReason: otherReasons[animal.officialId] || '',
    earTagParts: formatEarTagParts(animal.officialId)
  }))
}

function buildSelectedAnimalSummary(animals, ids) {
  const selectedIds = Array.isArray(ids) ? ids : (ids ? [ids] : [])
  const idSet = new Set(selectedIds)

  return animals
    .filter(animal => idSet.has(animal.officialId))
    .map(animal => `${animal.officialId} – ${animal.breed} – ${animal.sex} – DOB ${animal.dob}`)
}

function renderSelectVaccinatedAnimals(req, res, options = {}) {
  const animals = getReportingAnimals(req)
  const decisionMap = getDecisionMap(req.session.data)
  const otherReasons = req.session.data.otherReasons || {}
  const groups = getReportingGroups(animals, decisionMap)
  const selectedIds = Array.isArray(options.selectedIds) ? options.selectedIds : []
  const activeReviewGroup = req.session.data.activeReviewGroup || 'remaining'
  const markingPhase = req.session.data.markingPhase || 'vaccinated'
  const activeRows = getRowsForReviewGroup(groups, activeReviewGroup, otherReasons)

  return res.render('v1-0/select-vaccinated-animals', {
    herd: req.session.data.herd || herdData[req.session.data.selectedCattle],
    activeRows,
    activeReviewGroup,
    activeReviewGroupLabel: getGroupLabel(activeReviewGroup),
    summaryBuckets: getSummaryBuckets(groups),
    totalAnimals: animals.length,
    totalRemaining: groups.remaining.length,
    totalMarked: animals.length - groups.remaining.length,
    allComplete: groups.remaining.length === 0,
    markingPhase,
    selectedIds,
    selectedAnimalSummary: buildSelectedAnimalSummary(animals, selectedIds),
    errors: options.errors,
    errorSummary: options.errorSummary,
    formValues: options.formValues || {}
  })
}

function buildActivePreviewTags(options) {
  const tags = []

  if (options.downloadFormat === 'csv') {
    tags.push('File format: CSV')
  } else {
    tags.push('File format: Printable list (PDF)')
  }

  if (options.downloadFormat !== 'csv' && options.previewTextSize && options.previewTextSize !== 'standard') {
    tags.push(`Text size: ${options.previewTextSize}`)
  }

  if (options.downloadFormat !== 'csv' && options.previewOrientation && options.previewOrientation !== 'portrait') {
    tags.push(`Orientation: ${options.previewOrientation}`)
  }

  if (options.downloadFormat !== 'csv' && options.previewSpacing && options.previewSpacing !== 'standard') {
    tags.push(`Line spacing: ${options.previewSpacing}`)
  }

  if (options.downloadFormat !== 'csv' && options.emphasiseLastFive) {
    tags.push('Last 5 digits emphasised')
  }

  options.visibleColumns.forEach(column => {
    tags.push(`Show: ${column === 'Age (youngest to oldest)' ? 'Age' : column}`)
  })

  return tags
}

router.get('/v1-0/check-list-details', function (req, res) {
  res.render('v1-0/check-list-details')
})

router.post('/v1-0/check-list-details', function (req, res) {
  let fields = req.body.fields || []

  if (!Array.isArray(fields)) {
    fields = [fields]
  }

  req.session.data.fields = fields.filter(field => field && field !== '_unchecked')
  req.session.data.sortBy = req.body.sortBy || 'Ear-tag number'
  req.session.data.sortDirection = req.body.sortDirection || 'asc'

  res.redirect('/v1-0/download-list')
})


router.get('/v1-0/prepare-list-download', function (req, res) {
  res.render('v1-0/prepare-list-download')
})

router.post('/v1-0/prepare-list-download', function (req, res) {
  const downloadFormat = req.body.downloadFormat

  req.session.data.listType = req.session.data.listType || 'Vaccinate cattle'

  if (!downloadFormat) {
    return res.render('v1-0/prepare-list-download', {
      errors: {
        downloadFormat: { text: 'Select how you want to download the list' }
      },
      errorSummary: {
        titleText: 'There is a problem',
        errorList: [
          {
            text: 'Select how you want to download the list',
            href: '#downloadFormat'
          }
        ]
      }
    })
  }

  req.session.data.downloadFormat = downloadFormat

  if (!normaliseFields(req.session.data.fields).length) {
    req.session.data.fields = availableListColumns
  }

  req.session.data.sortBy = req.session.data.sortBy || 'Ear-tag number'
  req.session.data.sortDirection = req.session.data.sortDirection || 'asc'
  req.session.data.previewOptions = req.session.data.previewOptions || ['show-last-five', ...availableListColumns]

  res.redirect('/v1-0/check-list-details')
})

router.post('/v1-0/download-list/setup', function (req, res) {
  req.session.data.listType = req.body.listType || req.session.data.listType || 'Vaccinate cattle'

  if (!normaliseFields(req.session.data.fields).length) {
    req.session.data.fields = availableListColumns
  }

  req.session.data.downloadFormat = req.session.data.downloadFormat || 'pdf'
  req.session.data.sortBy = req.session.data.sortBy || 'Ear-tag number'
  req.session.data.sortDirection = req.session.data.sortDirection || 'asc'
  req.session.data.previewOptions = req.session.data.previewOptions || ['show-last-five', ...availableListColumns]

  res.redirect('/v1-0/download-list')
})

router.post('/v1-0/download-list', function (req, res) {
  const downloadFormat = req.body.downloadFormat || req.session.data.downloadFormat || 'pdf'
  const selectedOptions = normalisePreviewOptions(req.body.previewOptions || [], req.session.data.fields)
  const selectedFields = availableListColumns.filter(field => selectedOptions.includes(field))

  req.session.data.downloadFormat = downloadFormat
  req.session.data.previewTextSize = req.body.previewTextSize || 'standard'
  req.session.data.previewOrientation = req.body.previewOrientation || 'portrait'
  req.session.data.previewSpacing = req.body.previewSpacing || 'standard'
  req.session.data.previewOptions = selectedOptions
  req.session.data.fields = selectedFields
  req.session.data.sortBy = req.body.sortBy || req.session.data.sortBy || 'Ear-tag number'
  req.session.data.sortDirection = req.body.sortDirection || req.session.data.sortDirection || 'asc'

  res.redirect('/v1-0/download-list')
})

router.get('/v1-0/download-list/reset', function (req, res) {
  const fields = normaliseFields(req.session.data.fields)

  req.session.data.downloadFormat = req.session.data.downloadFormat || 'pdf'
  req.session.data.previewTextSize = 'standard'
  req.session.data.previewOrientation = 'portrait'
  req.session.data.previewSpacing = 'standard'
  req.session.data.previewOptions = ['show-last-five', ...fields]

  res.redirect('/v1-0/download-list')
})

router.get('/v1-0/download-list', function (req, res) {
  const selectedCattle = req.session.data.selectedCattle
  const fields = normaliseFields(req.session.data.fields)
  const sortBy = req.session.data.sortBy || 'Ear-tag number'
  const sortDirection = req.session.data.sortDirection || 'asc'
  const downloadFormat = req.session.data.downloadFormat || 'pdf'
  const animals = sortAnimals(getAnimalsForSelection(selectedCattle), sortBy, sortDirection)
  const previewSettings = getPreviewSettings(req.session.data, fields)

  res.render('v1-0/download-list', {
    previewRows: buildPreviewRows(animals, previewSettings.visibleColumns),
    previewColumns: previewSettings.visibleColumns,
    previewAnimals: animals,
    previewTextSize: previewSettings.previewTextSize,
    previewOrientation: previewSettings.previewOrientation,
    previewSpacing: previewSettings.previewSpacing,
    previewOptions: previewSettings.previewOptions,
    previewAllColumns: previewSettings.allColumns,
    emphasiseLastFive: previewSettings.emphasiseLastFive,
    downloadFormat,
    downloadFormatLabel: downloadFormat === 'csv' ? 'CSV' : 'Printable list (PDF)',
    sortDirectionLabel: sortDirection === 'desc' ? 'Descending' : 'Ascending',
    printedDate: new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date()),
    activePreviewTags: buildActivePreviewTags({
      downloadFormat,
      previewTextSize: previewSettings.previewTextSize,
      previewOrientation: previewSettings.previewOrientation,
      previewSpacing: previewSettings.previewSpacing,
      emphasiseLastFive: previewSettings.emphasiseLastFive,
      visibleColumns: previewSettings.visibleColumns
    })
  })
})

module.exports = router
