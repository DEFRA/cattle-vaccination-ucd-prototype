// Fixed routes for v1-0 prototype
// Includes:
// - _unchecked fix
// - HTML preview logic for CSV and PDF selections
// - sort direction support
// - preview data driven by user selections from customise-list

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// -----------------------------------------------------------------------------
// Stub herd / cattle search data
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Stub animal data for download preview
// -----------------------------------------------------------------------------
const animalData = {
  '12/345/6789': [
    {
      officialId: 'UK341234412177',
      earTagNumber: 'UK341234412177',
      barcode: 'UK341234412177',
      breed: 'Holstein Friesian',
      breedCode: 'HF',
      dob: '06/12/2022',
      age: 28,
      sex: 'Female',
      sexCode: 'F',
      vaccinationStatus: 'Vaccinated',
      notes: 'Duplicate'
    },
    {
      officialId: 'UK341123302177',
      earTagNumber: 'UK341123302177',
      barcode: 'UK341123302177',
      breed: 'British Friesian',
      breedCode: 'BF',
      dob: '06/12/2024',
      age: 4,
      sex: 'Female',
      sexCode: 'F',
      vaccinationStatus: 'Not vaccinated',
      notes: 'NO Gamma'
    },
    {
      officialId: 'UK341567812199',
      earTagNumber: 'UK341567812199',
      barcode: 'UK341567812199',
      breed: 'Angus Cross',
      breedCode: 'AX',
      dob: '13/03/2023',
      age: 25,
      sex: 'Male',
      sexCode: 'M',
      vaccinationStatus: 'Vaccinated',
      notes: ''
    }
  ],
  '12/345/6789-UK123456001': [
    {
      officialId: 'UK123456001',
      earTagNumber: 'UK123456001',
      barcode: 'UK123456001',
      breed: 'Holstein Friesian',
      breedCode: 'HF',
      dob: '06/12/2022',
      age: 28,
      sex: 'Female',
      sexCode: 'F',
      vaccinationStatus: 'Vaccinated',
      notes: 'Selected animal only'
    }
  ],
  '98/765/4321': [
    {
      officialId: 'UK987654321001',
      earTagNumber: 'UK987654321001',
      barcode: 'UK987654321001',
      breed: 'Limousin',
      breedCode: 'LM',
      dob: '02/02/2023',
      age: 26,
      sex: 'Female',
      sexCode: 'F',
      vaccinationStatus: 'Vaccinated',
      notes: ''
    },
    {
      officialId: 'UK987654321002',
      earTagNumber: 'UK987654321002',
      barcode: 'UK987654321002',
      breed: 'Charolais',
      breedCode: 'CH',
      dob: '19/08/2024',
      age: 8,
      sex: 'Male',
      sexCode: 'M',
      vaccinationStatus: 'Not vaccinated',
      notes: ''
    }
  ]
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function getAnimalsForSelection(selectedCattle) {
  return animalData[selectedCattle] || animalData['12/345/6789']
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
      return animal.vaccinationStatus
    case 'Ear-tag number':
      return animal.earTagNumber
    case 'Sex':
      return animal.sex
    case 'Breed':
      return animal.breed
    default:
      return ''
  }
}

function buildPreviewColumns(fields) {
  const selectedFields = normaliseFields(fields)

  if (!selectedFields.length) {
    return ['Ear-tag number', 'Breed', 'Sex']
  }

  return selectedFields
}

function buildPreviewRows(animals, fields) {
  const selectedFields = buildPreviewColumns(fields)

  return animals.map(animal => {
    return {
      officialId: animal.officialId,
      barcode: animal.barcode,
      notes: animal.notes,
      cells: selectedFields.map(field => ({
        key: field,
        value: getFieldValue(animal, field)
      }))
    }
  })
}

// -----------------------------------------------------------------------------
// Sign in
// -----------------------------------------------------------------------------
router.get('/v1-0/sign-in', function (req, res) {
  res.render('v1-0/sign-in')
})

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

// -----------------------------------------------------------------------------
// Dashboard and work orders
// -----------------------------------------------------------------------------
router.get('/v1-0/dashboard', function (req, res) {
  res.render('v1-0/dashboard')
})

router.get('/v1-0/workorder-list', function (req, res) {
  res.render('v1-0/workorder-list')
})

router.get('/v1-0/workorder-tasks', function (req, res) {
  res.render('v1-0/workorder-tasks')
})

// -----------------------------------------------------------------------------
// Schedule vaccination
// -----------------------------------------------------------------------------
router.get('/v1-0/schedule-vaccination', function (req, res) {
  res.render('v1-0/schedule-vaccination')
})

router.post('/v1-0/schedule-vaccination', function (req, res) {
  req.session.data.vaccinationDateDay = req.body.vaccinationDateDay
  req.session.data.vaccinationDateMonth = req.body.vaccinationDateMonth
  req.session.data.vaccinationDateYear = req.body.vaccinationDateYear

  res.redirect('/v1-0/schedule-vaccination-confirmation')
})

router.get('/v1-0/schedule-vaccination-confirmation', function (req, res) {
  res.render('v1-0/schedule-vaccination-confirmation')
})

// -----------------------------------------------------------------------------
// Prepare list journey
// -----------------------------------------------------------------------------
router.get('/v1-0/prepare-list-for', function (req, res) {
  res.render('v1-0/prepare-list-for')
})

router.post('/v1-0/choose-cattle', function (req, res) {
  req.session.data.listType = req.body.listType
  res.redirect('/v1-0/choose-cattle')
})

router.get('/v1-0/choose-cattle', function (req, res) {
  res.render('v1-0/choose-cattle')
})

// Search
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

router.get('/v1-0/choose-cattle-results', function (req, res) {
  res.render('v1-0/choose-cattle-results')
})

router.post('/v1-0/herd-details', function (req, res) {
  const selected = req.body.selectedCattle
  const selectedHerd = herdData[selected]

  req.session.data.selectedCattle = selected
  req.session.data.herd = selectedHerd
  req.session.data.selectedCattleLabel = selectedHerd ? selectedHerd.label : selected

  res.render('v1-0/herd-details')
})

router.get('/v1-0/herd-details', function (req, res) {
  res.render('v1-0/herd-details')
})

// -----------------------------------------------------------------------------
// Download and customise list
// -----------------------------------------------------------------------------
router.get('/v1-0/prepare-list-download', function (req, res) {
  res.render('v1-0/prepare-list-download')
})

router.post('/v1-0/customise-list', function (req, res) {
  req.session.data.downloadFormat = req.body.downloadFormat
  res.redirect('/v1-0/customise-list')
})

router.get('/v1-0/customise-list', function (req, res) {
  res.render('v1-0/customise-list')
})

router.post('/v1-0/check-list', function (req, res) {
  let fields = req.body.fields || []

  if (!Array.isArray(fields)) {
    fields = [fields]
  }

  fields = fields.filter(field => field && field !== '_unchecked')

  req.session.data.fields = fields
  req.session.data.sortBy = req.body.sortBy
  req.session.data.sortDirection = req.body.sortDirection || 'asc'

  res.redirect('/v1-0/check-list')
})

router.get('/v1-0/check-list', function (req, res) {
  res.render('v1-0/check-list')
})

router.post('/v1-0/download-list', function (req, res) {
  res.redirect('/v1-0/download-list')
})

router.get('/v1-0/download-list', function (req, res) {
  const selectedCattle = req.session.data.selectedCattle
  const downloadFormat = req.session.data.downloadFormat || 'pdf'
  const fields = normaliseFields(req.session.data.fields)
  const sortBy = req.session.data.sortBy || 'Ear-tag number'
  const sortDirection = req.session.data.sortDirection || 'asc'

  const animals = sortAnimals(
    getAnimalsForSelection(selectedCattle),
    sortBy,
    sortDirection
  )

  const previewColumns = buildPreviewColumns(fields)
  const previewRows = buildPreviewRows(animals, fields)

  const downloadFormatLabel =
    downloadFormat === 'pdf' ? 'Printable list (PDF)' : 'CSV'

  res.render('v1-0/download-list', {
    previewRows: previewRows,
    previewColumns: previewColumns,
    previewAnimals: animals,
    downloadFormatLabel: downloadFormatLabel,
    isPdf: downloadFormat === 'pdf',
    isCsv: downloadFormat === 'csv',
    sortDirectionLabel: sortDirection === 'desc' ? 'Descending' : 'Ascending'
  })
})

module.exports = router
