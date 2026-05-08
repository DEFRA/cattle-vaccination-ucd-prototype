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

  return res.redirect('/v1-0/enter-vaccination-date')
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
  return res.redirect('/v1-0/select-vaccinated-animals')
})

router.post('/v1-0/select-vaccinated-animals', (req, res) => {
  req.session.data.vaccinatedCattle = req.body.vaccinatedCattle || []
  return res.redirect('/v1-0/add-a-note')
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
  const vaccinationField = selectedFields.find(field => field === 'Vaccination status')
  const remainingFields = selectedFields.filter(field => field !== 'Vaccination status')

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
  const allFields = buildPreviewColumns(fields)
  const submitted = Array.isArray(options) ? options : (options ? [options] : [])
  const filtered = submitted.filter(option => option && option !== '_unchecked')

  if (!filtered.length) {
    return ['show-last-five', ...allFields]
  }

  return filtered
}

function getPreviewSettings(sessionData, fields) {
  const allFields = buildPreviewColumns(fields)
  const previewOptions = normalisePreviewOptions(sessionData.previewOptions, fields)

  return {
    previewTextSize: sessionData.previewTextSize || 'standard',
    previewOrientation: sessionData.previewOrientation || 'portrait',
    previewSpacing: sessionData.previewSpacing || 'standard',
    previewOptions,
    emphasiseLastFive: previewOptions.includes('show-last-five'),
    visibleColumns: allFields.filter(field => previewOptions.includes(field))
  }
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
  if (req.body.listType) {
    req.session.data.listType = req.body.listType
  } else {
    req.session.data.listType = req.session.data.listType || 'Vaccinate cattle'
  }

  req.session.data.downloadFormat = req.body.downloadFormat || req.session.data.downloadFormat || 'pdf'

  if (!normaliseFields(req.session.data.fields).length) {
    req.session.data.fields = availableListColumns
  }

  req.session.data.sortBy = req.session.data.sortBy || 'Ear-tag number'
  req.session.data.sortDirection = req.session.data.sortDirection || 'asc'
  req.session.data.previewOptions = req.session.data.previewOptions || ['show-last-five', ...availableListColumns]

  res.redirect('/v1-0/check-list-details')
})

router.post('/v1-0/download-list', function (req, res) {
  const fields = normaliseFields(req.session.data.fields)
  const previewOptions = req.body.previewOptions || []

  req.session.data.previewTextSize = req.body.previewTextSize || 'standard'
  req.session.data.previewOrientation = req.body.previewOrientation || 'portrait'
  req.session.data.previewSpacing = req.body.previewSpacing || 'standard'
  req.session.data.previewOptions = normalisePreviewOptions(previewOptions, fields)

  res.redirect('/v1-0/download-list')
})

router.get('/v1-0/download-list', function (req, res) {
  const selectedCattle = req.session.data.selectedCattle
  const fields = normaliseFields(req.session.data.fields)
  const sortBy = req.session.data.sortBy || 'Ear-tag number'
  const sortDirection = req.session.data.sortDirection || 'asc'
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
    emphasiseLastFive: previewSettings.emphasiseLastFive,
    sortDirectionLabel: sortDirection === 'desc' ? 'Descending' : 'Ascending',
    printedDate: new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date())
  })
})

module.exports = router
