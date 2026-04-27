const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// -----------------------------------------------------------------------------
// Herd data: 20 representative English cattle farms
// -----------------------------------------------------------------------------
const herdData = {
  '12/345/6789': { cph: '12/345/6789', farm: 'Hill Farm', address: 'Hill Farm, York, YO1 1AA', cattle: '244' },
  '17/205/6790': { cph: '17/205/6790', farm: 'Moor Farm', address: 'Moor Farm, Leeds, LS1 2AB', cattle: '58' },
  // Orchard Gate Farm – main holding + dairy unit
  '12/340/6791':    { cph: '12/340/6791',    farm: 'Orchard Gate Farm', address: 'Orchard Gate Farm, Ripon, HG4 1BC',            cattle: '80',  holdingLabel: 'Main holding' },
  '12/340/6791-01': { cph: '12/340/6791-01', farm: 'Orchard Gate Farm', address: 'Orchard Gate Dairy Unit, Ripon, HG4 1BC',      cattle: '52',  holdingLabel: 'Dairy unit' },
  '12/348/6792': { cph: '12/348/6792', farm: 'Willow Bank Farm', address: 'Willow Bank Farm, Selby, YO8 4CD', cattle: '41' },
  '12/325/6793': { cph: '12/325/6793', farm: 'Red Barn Farm', address: 'Red Barn Farm, Thirsk, YO7 3DE', cattle: '173' },
  '12/338/6794': { cph: '12/338/6794', farm: 'Meadow View Farm', address: 'Meadow View Farm, Harrogate, HG1 5EF', cattle: '97' },
  '12/360/6795': { cph: '12/360/6795', farm: 'Low Beck Farm', address: 'Low Beck Farm, Malton, YO17 7FG', cattle: '326' },
  '12/315/6796': { cph: '12/315/6796', farm: 'West Field Farm', address: 'West Field Farm, Bedale, DL8 1GH', cattle: '119' },
  '12/310/6797': { cph: '12/310/6797', farm: 'Oak Tree Farm', address: 'Oak Tree Farm, Skipton, BD23 2HJ', cattle: '64' },
  '24/420/6798': { cph: '24/420/6798', farm: 'Stonebridge Farm', address: 'Stonebridge Farm, Beverley, HU17 8JK', cattle: '211' },
  // High Pastures Farm – main holding + beef finishing unit
  '12/320/6799':    { cph: '12/320/6799',    farm: 'High Pastures Farm', address: 'High Pastures Farm, Northallerton, DL7 9KL',   cattle: '200', holdingLabel: 'Main holding' },
  '12/320/6799-01': { cph: '12/320/6799-01', farm: 'High Pastures Farm', address: 'High Pastures Beef Unit, Northallerton, DL7 9KL', cattle: '187', holdingLabel: 'Beef finishing unit' },
  '24/402/6800': { cph: '24/402/6800', farm: 'Green Lane Farm', address: 'Green Lane Farm, Pocklington, YO42 1LM', cattle: '72' },
  '24/405/6801': { cph: '24/405/6801', farm: 'Sunnyside Farm', address: 'Sunnyside Farm, Driffield, YO25 6MN', cattle: '158' },
  '12/312/6802': { cph: '12/312/6802', farm: 'Mill House Farm', address: 'Mill House Farm, Richmond, DL10 4NP', cattle: '38' },
  '12/365/6803': { cph: '12/365/6803', farm: 'Hazelcroft Farm', address: 'Hazelcroft Farm, Helmsley, YO62 5PQ', cattle: '146' },
  // Birch Hollow Farm – main holding + youngstock unit
  '17/221/6804':    { cph: '17/221/6804',    farm: 'Birch Hollow Farm', address: 'Birch Hollow Farm, Otley, LS21 3QR',           cattle: '250', holdingLabel: 'Main holding' },
  '17/221/6804-01': { cph: '17/221/6804-01', farm: 'Birch Hollow Farm', address: 'Birch Hollow Youngstock Unit, Otley, LS21 3QR', cattle: '171', holdingLabel: 'Youngstock unit' },
  '17/218/6805': { cph: '17/218/6805', farm: 'Rosewood Farm', address: 'Rosewood Farm, Wetherby, LS22 6RS', cattle: '89' },
  '12/355/6806': { cph: '12/355/6806', farm: 'Brookside Farm', address: 'Brookside Farm, Easingwold, YO61 3ST', cattle: '184' },
  '12/370/6807': { cph: '12/370/6807', farm: 'Elm Carr Farm', address: 'Elm Carr Farm, Pickering, YO18 7TU', cattle: '267' },
  // Riverside Farm – main holding + dairy unit + beef finishing unit
  '12/352/6808':    { cph: '12/352/6808',    farm: 'Riverside Farm', address: 'Riverside Farm, Tadcaster, LS24 9UV',            cattle: '300', holdingLabel: 'Main holding' },
  '12/352/6808-01': { cph: '12/352/6808-01', farm: 'Riverside Farm', address: 'Riverside Dairy Unit, Tadcaster, LS24 9UV',      cattle: '130', holdingLabel: 'Dairy unit' },
  '12/352/6808-02': { cph: '12/352/6808-02', farm: 'Riverside Farm', address: 'Riverside Beef Finishing Unit, Tadcaster, LS24 9UV', cattle: '82',  holdingLabel: 'Beef finishing unit' }
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

// -----------------------------------------------------------------------------
// V1-1 multi-field farm search
//
// A single search input accepts any combination of CPH, farm name, postcode
// and ear tag. The query is split into whitespace tokens; each token is then
// checked against every CPH's searchable blob (cph + farm + address +
// holding label). Tokens that look like ear tags also trigger a scan of the
// animal dataset so a farm can be found by its cattle.
//
// Each CPH gets a score that rewards:
//   * each token that matches anywhere in the blob
//   * exact CPH or farm-name matches
//   * ear-tag hits (strong boost so an ear tag always wins over a loose
//     text match)
//
// After ranking, the CPHs are grouped by farm name so the results page can
// show a farm and all its sub-holdings in a single block.
// -----------------------------------------------------------------------------

function extractTown(address) {
  const parts = String(address || '').split(',').map(s => s.trim())
  return parts[parts.length - 2] || parts[0] || ''
}

function extractPostcode(address) {
  const parts = String(address || '').split(',').map(s => s.trim())
  return parts[parts.length - 1] || ''
}

function earTagCphMatches(tokens) {
  const hits = new Set()
  if (!tokens.length) return hits

  // Only treat a token as an ear-tag query when it's clearly ear-tag-shaped:
  //   - starts with "UK" (any number of trailing digits, 4+), OR
  //   - is 5+ digits long (4-digit numbers are ambiguous with CPH fragments).
  // Matching uses equality or trailing-digits only; we deliberately don't
  // match substrings in the middle of an ear tag – that would create lots
  // of false positives from short digit fragments.
  const digitTokens = []
  for (const t of tokens) {
    const startsWithUk = /^uk/i.test(t)
    const cleaned = t.replace(/^uk/i, '').replace(/[^0-9]/g, '')
    if (cleaned.length >= (startsWithUk ? 4 : 5)) {
      digitTokens.push(cleaned)
    }
  }
  if (!digitTokens.length) return hits

  for (const cph of Object.keys(v11AnimalsByCph)) {
    const animals = v11AnimalsByCph[cph] || []
    for (let i = 0; i < animals.length; i++) {
      const id = animals[i].officialId
      let matched = false
      for (const dt of digitTokens) {
        if (id === 'UK' + dt || id.endsWith(dt)) {
          matched = true
          break
        }
      }
      if (matched) {
        hits.add(cph)
        break
      }
    }
  }
  return hits
}

function searchV11(query) {
  const q = String(query || '').trim()
  if (!q) {
    return { candidates: [], groups: [] }
  }

  const tokens = q.split(/\s+/).map(t => t.toLowerCase()).filter(Boolean)
  const earTagHits = earTagCphMatches(tokens)

  const candidates = []
  for (const cph of Object.keys(herdData)) {
    const herd = herdData[cph]
    const blob = [
      cph,
      herd.farm || '',
      herd.address || '',
      herd.holdingLabel || ''
    ].join(' ').toLowerCase()

    let tokenMatches = 0
    for (const token of tokens) {
      if (blob.includes(token)) tokenMatches++
    }

    let score = tokenMatches * 2
    if (earTagHits.has(cph)) score += 20
    if (tokens.some(t => t === cph.toLowerCase())) score += 5
    const farmLower = (herd.farm || '').toLowerCase()
    if (tokens.some(t => farmLower === t)) score += 5

    if (score > 0) {
      candidates.push({ cph, herd, score, tokenMatches, earTagMatch: earTagHits.has(cph) })
    }
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return (a.herd.farm || '').localeCompare(b.herd.farm || '')
  })

  const groups = groupResultsByFarm(candidates)

  return { candidates, groups }
}

function groupResultsByFarm(candidates) {
  // Collect every farm that had at least one matching CPH.
  const matchedFarms = new Set(candidates.map(c => c.herd.farm))
  const scoreByFarm = {}
  candidates.forEach(c => {
    const name = c.herd.farm
    if ((scoreByFarm[name] || 0) < c.score) scoreByFarm[name] = c.score
  })

  // For each matched farm, include ALL of that farm's CPHs so users can
  // pick between the main holding and any sub-holdings even when they only
  // typed part of the query.
  const groupsByFarm = {}
  for (const cph of Object.keys(herdData)) {
    const herd = herdData[cph]
    if (!matchedFarms.has(herd.farm)) continue

    if (!groupsByFarm[herd.farm]) {
      groupsByFarm[herd.farm] = {
        farm: herd.farm,
        location: extractTown(herd.address),
        postcode: extractPostcode(herd.address),
        totalCattle: 0,
        topScore: scoreByFarm[herd.farm] || 0,
        cphs: []
      }
    }
    groupsByFarm[herd.farm].cphs.push({
      cph,
      holdingLabel: herd.holdingLabel || 'Main holding',
      cattle: herd.cattle,
      address: herd.address
    })
    groupsByFarm[herd.farm].totalCattle += Number(herd.cattle) || 0
  }

  // Sort CPHs inside each group: main holding first, then sub-holdings.
  Object.values(groupsByFarm).forEach(g => {
    g.cphs.sort((a, b) => {
      const aMain = a.cph.indexOf('-') === -1
      const bMain = b.cph.indexOf('-') === -1
      if (aMain !== bMain) return aMain ? -1 : 1
      return a.cph.localeCompare(b.cph)
    })
  })

  return Object.values(groupsByFarm).sort((a, b) => {
    if (b.topScore !== a.topScore) return b.topScore - a.topScore
    return a.farm.localeCompare(b.farm)
  })
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

function handleFarmSearch(req, res, pageName, version) {
  const searchInput = (req.body.cattleSearch || req.body.search || '').trim()

  req.session.data.cattleSearch = searchInput
  req.session.data.search = searchInput

  if (!searchInput) {
    return renderSearchPage(req, res, pageName, {
      cattleSearch: { text: 'Enter a CPH, farm name, postcode or ear tag' }
    })
  }

  if (version === 'v1-1') {
    const { candidates, groups } = searchV11(searchInput)
    req.session.data.searchResultGroups = groups
    // Keep a flat list for any legacy page that still reads searchResults.
    req.session.data.searchResults = candidates.map(c => ({
      value: c.cph,
      text: `${c.herd.cph}, ${c.herd.farm}`,
      html: `<strong>${c.herd.cph}, ${c.herd.farm}</strong>`,
      hint: {
        text: `${c.herd.address.replace(c.herd.farm + ', ', '')} – ${c.herd.cattle} cattle`
      }
    }))
  } else {
    req.session.data.searchResults = searchResultsForTerm(searchInput)
  }

  res.redirect(`/${version}/search-results`)
}

function handleReportSearch(req, res, pageName, version) {
  const searchInput = (req.body.reportSearch || '').trim()

  req.session.data.reportSearch = searchInput

  if (!searchInput) {
    return renderSearchPage(req, res, pageName, {
      reportSearch: { text: 'Enter a CPH, farm name or ear tag' }
    })
  }

  req.session.data.reportSearchResults = searchResultsForTerm(searchInput)
  res.redirect(`/${version}/choose-a-herd-or-animal-to-report`)
}

// -----------------------------------------------------------------------------
// Download list preview data and helpers
// -----------------------------------------------------------------------------
const baseAnimalData = {
  '12/345/6789': [
    {
      officialId: 'UK341234412177',
      earTagNumber: 'UK341234412177',
      barcode: 'UK341234412177',
      breed: 'HF',
      dob: '06/12/2022',
      age: 28,
      sex: 'F',
      vaccinationStatus: 'Vaccinated',
      notes: 'Duplicate'
    },
    {
      officialId: 'UK341123302177',
      earTagNumber: 'UK341123302177',
      barcode: 'UK341123302177',
      breed: 'BF',
      dob: '06/12/2024',
      age: 4,
      sex: 'F',
      vaccinationStatus: 'Not vaccinated',
      notes: 'NO Gamma'
    },
    {
      officialId: 'UK341567812199',
      earTagNumber: 'UK341567812199',
      barcode: 'UK341567812199',
      breed: 'AAX',
      dob: '13/03/2023',
      age: 25,
      sex: 'M',
      vaccinationStatus: 'Vaccinated',
      notes: ''
    }
  ],
  '17/205/6790': [
    {
      officialId: 'UK120900112301',
      earTagNumber: 'UK120900112301',
      barcode: 'UK120900112301',
      breed: 'LIM',
      dob: '02/02/2023',
      age: 26,
      sex: 'F',
      vaccinationStatus: 'Vaccinated',
      notes: ''
    },
    {
      officialId: 'UK120900112302',
      earTagNumber: 'UK120900112302',
      barcode: 'UK120900112302',
      breed: 'CH',
      dob: '19/08/2024',
      age: 8,
      sex: 'M',
      vaccinationStatus: 'Not vaccinated',
      notes: ''
    }
  ]
}

const herdTagConfig = {
  '12/345/6789': { herdMark: '341234', checkDigit: '4' },
  '17/205/6790': { herdMark: '120900', checkDigit: '1' },
  '12/348/6792': { herdMark: '123456', checkDigit: '7' },
  '12/352/6808': { herdMark: '183483', checkDigit: '7' }
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
  const breeds = ['HF', 'BF', 'AAX', 'LIM', 'CH']
  const sex = index % 5 === 0 ? 'M' : 'F'
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

// -----------------------------------------------------------------------------
// V1-1 realistic herd dataset
//
// For each farm we build a more representative list of animals:
//   * 70–80% of cattle share the farm's own herd mark (home-born), with
//     near-sequential individual numbers that contain small random gaps to
//     simulate real births over time.
//   * 10–18% carry a different herd mark (moved in from another farm).
//   * 5–9% share the last 4 digits of another animal on the same farm but
//     use a different herd mark – the realistic "ear-tag duplicate" risk.
//   * 1–2 "out of place" animals with unusual numbering (older imports).
//
// Bought-in and duplicate-ending animals are shuffled through the list
// rather than grouped at the end. Data is generated once at module load
// from a deterministic PRNG (seeded from the CPH) so every request for the
// same farm returns the same list.
// V1-0 is unaffected and continues to use `createGeneratedAnimal` above.
// -----------------------------------------------------------------------------

const v11HerdMarks = {
  '12/345/6789': { mark: '341234', check: '4' },
  '17/205/6790': { mark: '120900', check: '1' },
  '12/340/6791': { mark: '562301', check: '5' },
  '12/348/6792': { mark: '123456', check: '7' },
  '12/325/6793': { mark: '473829', check: '2' },
  '12/338/6794': { mark: '258147', check: '8' },
  '12/360/6795': { mark: '369258', check: '3' },
  '12/315/6796': { mark: '741852', check: '6' },
  '12/310/6797': { mark: '852963', check: '9' },
  '24/420/6798': { mark: '963741', check: '1' },
  '12/320/6799': { mark: '147258', check: '4' },
  '24/402/6800': { mark: '321654', check: '7' },
  '24/405/6801': { mark: '654321', check: '2' },
  '12/312/6802': { mark: '987654', check: '5' },
  '12/365/6803': { mark: '456789', check: '8' },
  '17/221/6804': { mark: '246810', check: '0' },
  '17/218/6805': { mark: '135791', check: '3' },
  '12/355/6806': { mark: '579135', check: '6' },
  '12/370/6807': { mark: '813579', check: '9' },
  '12/352/6808': { mark: '183483', check: '7' }
}

const v11Breeds = ['HF', 'BF', 'AAX', 'LIM', 'CH', 'SIM', 'HER', 'BB', 'BALX', 'DS']

// Only the farms that have actually received the BCG vaccination round.
// Every other farm's animals are all "Not vaccinated".
const v11VaccinatedFarms = new Set([
  '12/345/6789', // Hill Farm
  '17/205/6790', // Moor Farm
  '12/340/6791', // Orchard Gate Farm
  '12/348/6792', // Willow Bank Farm
  '12/325/6793', // Red Barn Farm
  '12/338/6794'  // Meadow View Farm
])

// V1-1 farm TB status. Each farm has a realistic back-story a vet can read
// before choosing what to do on the visit. OTFW farms always have a recent
// breakdown date; OTF farms may have a historical breakdown or none on
// record. Last-test dates are spread from "tested last week" back to "four
// years ago" so the data feels lived-in.
const v11FarmTbStatus = {
  '12/345/6789': { status: 'OTF',  lastTestDate: '12 March 2026',     lastBreakdown: 'None recorded' },
  '17/205/6790': { status: 'OTFW', lastTestDate: '4 February 2026',   lastBreakdown: '18 August 2025' },
  '12/340/6791': { status: 'OTF',  lastTestDate: '9 January 2026',    lastBreakdown: '23 July 2023' },
  '12/348/6792': { status: 'OTF',  lastTestDate: '27 November 2025',  lastBreakdown: 'None recorded' },
  '12/325/6793': { status: 'OTFW', lastTestDate: '15 April 2026',     lastBreakdown: '2 April 2026' },
  '12/338/6794': { status: 'OTF',  lastTestDate: '5 October 2025',    lastBreakdown: 'None recorded' },
  '12/360/6795': { status: 'OTF',  lastTestDate: '30 August 2025',    lastBreakdown: '14 May 2022' },
  '12/315/6796': { status: 'OTFW', lastTestDate: '3 March 2026',      lastBreakdown: '9 February 2026' },
  '12/310/6797': { status: 'OTF',  lastTestDate: '14 June 2025',      lastBreakdown: 'None recorded' },
  '24/420/6798': { status: 'OTF',  lastTestDate: '22 December 2025',  lastBreakdown: 'None recorded' },
  '12/320/6799': { status: 'OTF',  lastTestDate: '11 March 2025',     lastBreakdown: '6 November 2024' },
  '24/402/6800': { status: 'OTF',  lastTestDate: '7 November 2024',   lastBreakdown: 'None recorded' },
  '24/405/6801': { status: 'OTFW', lastTestDate: '25 January 2026',   lastBreakdown: '12 January 2026' },
  '12/312/6802': { status: 'OTF',  lastTestDate: '19 September 2024', lastBreakdown: 'None recorded' },
  '12/365/6803': { status: 'OTF',  lastTestDate: '2 July 2025',       lastBreakdown: '16 May 2023' },
  '17/221/6804': { status: 'OTF',  lastTestDate: '28 November 2025',  lastBreakdown: 'None recorded' },
  '17/218/6805': { status: 'OTFW', lastTestDate: '8 April 2026',      lastBreakdown: '1 April 2026' },
  '12/355/6806': { status: 'OTF',  lastTestDate: '16 August 2025',    lastBreakdown: 'None recorded' },
  '12/370/6807': { status: 'OTF',  lastTestDate: '3 May 2024',        lastBreakdown: '21 February 2022' },
  '12/352/6808': { status: 'OTF',  lastTestDate: '30 January 2026',   lastBreakdown: 'None recorded' }
}

function getV11TbStatusForCph(cph) {
  // Sub-holdings share the main holding's TB status – the operation is
  // treated as a single farm for disease control purposes.
  const baseCph = String(cph || '').split('-')[0]
  const entry = v11FarmTbStatus[cph] || v11FarmTbStatus[baseCph]
  if (!entry) return null
  const fullName = entry.status === 'OTF'
    ? 'Officially TB Free'
    : 'Officially TB Free Withdrawn'
  return {
    status: entry.status,
    statusFullName: fullName,
    lastTestDate: entry.lastTestDate,
    lastBreakdown: entry.lastBreakdown
  }
}

// FNV-1a style hash so the PRNG seed is deterministic per CPH.
function v11Hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  }
  return h >>> 0
}

// Mulberry32 – a tiny, fast deterministic PRNG.
function v11Mulberry32(seed) {
  let state = seed >>> 0
  return function () {
    state = (state + 0x6D2B79F5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function v11BuildAnimal(herdMark, checkDigit, individual, rng, farmIsVaccinated) {
  const officialId = `UK${herdMark}${checkDigit}${individual}`
  const breed = v11Breeds[Math.floor(rng() * v11Breeds.length)]
  const sex = rng() < 0.85 ? 'F' : 'M'
  // Age in months. Most active dairy/beef cattle sit between 12 and 72 months.
  // We sprinkle a few calves (3–11 months) and older animals (73–96 months).
  let ageMonths
  const r = rng()
  if (r < 0.15) {
    ageMonths = 3 + Math.floor(rng() * 9)          // calves
  } else if (r < 0.9) {
    ageMonths = 12 + Math.floor(rng() * 61)        // 1–6 years
  } else {
    ageMonths = 73 + Math.floor(rng() * 24)        // older
  }
  const dayOfBirth = 1 + Math.floor(rng() * 28)
  // Only farms listed in v11VaccinatedFarms have any vaccinated cattle;
  // within those farms we keep the ~75% vaccinated ratio so the herd still
  // contains a realistic mix of vaccinated and un-vaccinated animals.
  const vaccinationStatus = (farmIsVaccinated && rng() < 0.75)
    ? 'Vaccinated'
    : 'Not vaccinated'
  return {
    officialId,
    earTagNumber: officialId,
    barcode: officialId,
    breed,
    dob: formatDateForOffset(ageMonths, dayOfBirth),
    age: ageMonths,
    sex,
    vaccinationStatus,
    notes: ''
  }
}

function v11GenerateFarmHerd(cph, count) {
  // Sub-holdings (CPHs with a "-NN" suffix) inherit their parent CPH's
  // herd mark, check digit and vaccinated status – a sub-holding is part
  // of the same farm operation.
  const baseCph = cph.split('-')[0]
  const config = v11HerdMarks[cph] || v11HerdMarks[baseCph]
  if (!config || count <= 0) {
    return []
  }
  const herdMark = config.mark
  const checkDigit = config.check
  const rng = v11Mulberry32(v11Hash(cph))
  const farmIsVaccinated = v11VaccinatedFarms.has(cph) || v11VaccinatedFarms.has(baseCph)

  // Composition targets.
  // Each duplicate pair flags 2 animals on the farm (source + dup-edge copy),
  // so targeting duplicateCount ≈ 6–10% of the herd means at least 12% of
  // tags end up flagged as DUP – comfortably above the "≥ 5% per farm"
  // minimum, with a hard floor of 2 pairs even on very small herds.
  const boughtInCount = Math.round(count * (0.10 + rng() * 0.08))  // 10–18%
  const duplicateCount = Math.max(2, Math.round(count * (0.06 + rng() * 0.04))) // ≥2, 6–10%
  const outOfPlaceCount = count >= 60 ? 2 : (count >= 20 ? 1 : 0)
  const homeCount = Math.max(count - boughtInCount - duplicateCount - outOfPlaceCount, 0)

  const animals = []
  const usedTags = new Set()

  const tryPush = function (animal) {
    if (usedTags.has(animal.officialId)) return false
    usedTags.add(animal.officialId)
    animals.push(animal)
    return true
  }

  const otherMarks = Object.values(v11HerdMarks).filter(m => m.mark !== herdMark)
  const oddMarks = [
    { mark: '001020', check: '0' },
    { mark: '999888', check: '9' }
  ]

  // Home-born animals – near-sequential individual numbers with small gaps.
  let next = 1 + Math.floor(rng() * 80)           // starting offset
  let safety = 0
  while (animals.length < homeCount && safety < homeCount * 4) {
    next += 1 + Math.floor(rng() * 3)             // gap of 1–3
    const individual = String(next).padStart(5, '0')
    tryPush(v11BuildAnimal(herdMark, checkDigit, individual, rng, farmIsVaccinated))
    safety++
  }

  // Bought-in animals – different herd marks, random individual numbers.
  let boughtAdded = 0
  safety = 0
  while (boughtAdded < boughtInCount && safety < boughtInCount * 4) {
    const other = otherMarks[Math.floor(rng() * otherMarks.length)]
    const individual = String(1 + Math.floor(rng() * 99999)).padStart(5, '0')
    if (tryPush(v11BuildAnimal(other.mark, other.check, individual, rng, farmIsVaccinated))) {
      boughtAdded++
    }
    safety++
  }

  // Duplicate-ending – share the FULL last 5 digits (the individual number)
  // of an existing animal, using a different herd mark. Matching the entire
  // individual number means the pair appears adjacent when the list is
  // sorted by "Ear tag number (last 5 digits)", which is the sort vets will
  // use on the farm. Detection still catches last-4 matches, so this is a
  // strict subset of duplicates; pairs naturally satisfy both rules.
  const pool = animals.slice()
  const usedSources = new Set()
  let dupAdded = 0
  safety = 0
  while (dupAdded < duplicateCount && pool.length && safety < duplicateCount * 10) {
    const source = pool[Math.floor(rng() * pool.length)]
    safety++
    if (usedSources.has(source.officialId)) continue    // don't reuse a source
    const sourceMark = source.officialId.slice(2, 8)
    // Pick a herd mark that is neither the home mark (already excluded in
    // otherMarks) nor the source animal's own mark (otherwise we'd rebuild
    // source exactly).
    const candidates = otherMarks.filter(m => m.mark !== sourceMark)
    if (!candidates.length) continue
    const other = candidates[Math.floor(rng() * candidates.length)]
    const individual = source.officialId.slice(-5)      // full last-5 match
    if (tryPush(v11BuildAnimal(other.mark, other.check, individual, rng, farmIsVaccinated))) {
      dupAdded++
      usedSources.add(source.officialId)
    }
  }

  // Out-of-place animals
  for (let i = 0; i < outOfPlaceCount; i++) {
    const odd = oddMarks[i % oddMarks.length]
    const individual = String(Math.floor(rng() * 99999)).padStart(5, '0')
    tryPush(v11BuildAnimal(odd.mark, odd.check, individual, rng, farmIsVaccinated))
  }

  // Top up with extra home animals if we're short (e.g. collision retries).
  safety = 0
  while (animals.length < count && safety < count * 4) {
    next += 1 + Math.floor(rng() * 3)
    const individual = String(next).padStart(5, '0')
    tryPush(v11BuildAnimal(herdMark, checkDigit, individual, rng, farmIsVaccinated))
    safety++
  }

  // Shuffle so bought-in and duplicate-edge animals are mixed through the list.
  for (let i = animals.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = animals[i]
    animals[i] = animals[j]
    animals[j] = tmp
  }

  // Per-farm vaccination overrides. Mill House Farm should have a small
  // number of vaccinated cattle (the farm isn't in v11VaccinatedFarms so
  // the default herd is fully unvaccinated). Mark a fixed couple of
  // animals as vaccinated so the prepare-list flow has a few DIVA
  // candidates to demo against. We also force two animals to be young
  // calves (2 and 3 months old) so the prepare-list flow has cattle that
  // the vet would mark as too young to test.
  if (baseCph === '12/312/6802') {
    let vaccinatedMarked = 0
    let calvesMarked = 0
    const calfAges = [2, 3]
    for (let i = 0; i < animals.length; i++) {
      if (vaccinatedMarked < 2 && animals[i].vaccinationStatus !== 'Vaccinated') {
        animals[i].vaccinationStatus = 'Vaccinated'
        vaccinatedMarked++
        continue
      }
      if (calvesMarked < calfAges.length) {
        const ageMonths = calfAges[calvesMarked]
        animals[i].age = ageMonths
        animals[i].dob = formatDateForOffset(ageMonths, 14)
        calvesMarked++
      }
      if (vaccinatedMarked >= 2 && calvesMarked >= calfAges.length) break
    }
  }

  return animals.slice(0, count)
}

function buildV11Dataset() {
  const result = {}
  Object.keys(herdData).forEach(function (cph) {
    const count = Number(herdData[cph].cattle) || 0
    result[cph] = v11GenerateFarmHerd(cph, count)
  })
  return result
}

// Build the v1-1 dataset once at module load time.
const v11AnimalsByCph = buildV11Dataset()

function getAnimalsForSelection(selectedCattle, version) {
  if (version === 'v1-1' && v11AnimalsByCph[selectedCattle]) {
    return v11AnimalsByCph[selectedCattle]
  }

  // V1-0 behaviour – unchanged.
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
    case 'Ear-tag number (last 5 digits)':
      // Sort by the last 5 digits of the ear tag (the "individual" portion)
      return String(animal.earTagNumber || '').slice(-5)
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
      return calculateAgeFromDob(animal.dob)
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
    // `individual` remains the full 5-digit individual number for any
    // legacy consumer. New code should use `individualStart` (the first
    // digit) + `last4` (the last 4 digits) so the highlight can sit on
    // just the last 4 without a visual gap before it.
    individual: cleaned.slice(7, 12),
    individualStart: cleaned.slice(7, 8),
    last4: cleaned.slice(-4)
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

function getReportingAnimals(req, version) {
  const selectedCattle = req.session.data.selectedCattle
  const sortBy = req.session.data.sortBy || 'Ear-tag number'
  const sortDirection = req.session.data.sortDirection || 'asc'
  return sortAnimals(getAnimalsForSelection(selectedCattle, version), sortBy, sortDirection)
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

  if (birthDate > today) {
    return ''
  }

  const msPerDay = 1000 * 60 * 60 * 24
  const daysOld = Math.floor((today - birthDate) / msPerDay)

  let monthsOld = (today.getFullYear() - birthDate.getFullYear()) * 12
    + (today.getMonth() - birthDate.getMonth())

  if (today.getDate() < birthDate.getDate()) {
    monthsOld -= 1
  }

  let yearsOld = today.getFullYear() - birthDate.getFullYear()

  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) {
    yearsOld -= 1
  }

  if (daysOld < 30) {
    return `${daysOld}D`
  }

  if (monthsOld < 12) {
    return `${Math.max(monthsOld, 1)}M`
  }

  return `${Math.max(yearsOld, 1)}Y`
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

function renderSelectVaccinatedAnimals(req, res, version, options = {}) {
  const animals = getReportingAnimals(req, version)
  const decisionMap = getDecisionMap(req.session.data)
  const otherReasons = req.session.data.otherReasons || {}
  const groups = getReportingGroups(animals, decisionMap)
  const selectedIds = Array.isArray(options.selectedIds) ? options.selectedIds : []
  const activeReviewGroup = req.session.data.activeReviewGroup || 'remaining'
  const markingPhase = req.session.data.markingPhase || 'vaccinated'
  const activeRows = getRowsForReviewGroup(groups, activeReviewGroup, otherReasons)

  return res.render(`${version}/select-vaccinated-animals`, {
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

// -----------------------------------------------------------------------------
// Register routes for a given prototype version (e.g. 'v1-0', 'v1-1').
// All route paths and template paths are prefixed with the version.
// -----------------------------------------------------------------------------
function registerVersionRoutes(version) {
  // ---------------------------------------------------------------------------
  // Start and sign-in routes
  // ---------------------------------------------------------------------------
  router.get(`/${version}/sign-in`, (req, res) => {
    res.render(`${version}/sign-in`)
  })

  router.post(`/${version}/sign-in`, (req, res) => {
    const signInMethod = req.body.signInMethod

    if (!signInMethod) {
      return res.render(`${version}/sign-in`, {
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
      return res.redirect(`/${version}/one-login`)
    }

    return res.redirect(`/${version}/dashboard`)
  })

  // ---------------------------------------------------------------------------
  // Search routes
  // ---------------------------------------------------------------------------
  router.get(`/${version}/search`, (req, res) => {
    res.render(`${version}/search`)
  })

  router.post(`/${version}/search`, (req, res) => {
    handleFarmSearch(req, res, `${version}/search`, version)
  })

  router.get(`/${version}/search-for-a-herd-or-animal`, (req, res) => {
    res.render(`${version}/search-for-a-herd-or-animal`)
  })

  router.post(`/${version}/search-for-a-herd-or-animal`, (req, res) => {
    handleFarmSearch(req, res, `${version}/search-for-a-herd-or-animal`, version)
  })

  router.get(`/${version}/search-results`, (req, res) => {
    res.render(`${version}/search-results`)
  })

  router.get(`/${version}/confirm-herd-or-animal`, (req, res) => {
    const locals = {}
    // Only v1-1 shows the TB status block – v1-0 template doesn't use it.
    if (version === 'v1-1' && req.session.data.selectedCattle) {
      locals.tbStatus = getV11TbStatusForCph(req.session.data.selectedCattle)
      // Count vaccinated cattle on the selected farm so the template
      // can show "Vaccinated cattle" under "Number of cattle".
      const animals = getAnimalsForSelection(req.session.data.selectedCattle, 'v1-1')
      locals.vaccinatedCount = animals.filter(function (a) {
        return a.vaccinationStatus === 'Vaccinated'
      }).length
    }
    res.render(`${version}/confirm-herd-or-animal`, locals)
  })

  router.post(`/${version}/confirm-herd-or-animal`, (req, res) => {
    const selected = req.body.selectedCattle

    if (!selected) {
      return res.render(`${version}/search-results`, {
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
    return res.redirect(`/${version}/confirm-herd-or-animal`)
  })

  router.get(`/${version}/search-for-a-herd-or-animal-to-report`, (req, res) => {
    res.render(`${version}/search-for-a-herd-or-animal-to-report`)
  })

  router.post(`/${version}/search-for-a-herd-or-animal-to-report`, (req, res) => {
    handleReportSearch(req, res, `${version}/search-for-a-herd-or-animal-to-report`, version)
  })

  router.get(`/${version}/choose-a-herd-or-animal-to-report`, (req, res) => {
    res.render(`${version}/choose-a-herd-or-animal-to-report`)
  })

  router.get(`/${version}/confirm-herd-or-animal-to-report`, (req, res) => {
    res.render(`${version}/confirm-herd-or-animal-to-report`)
  })

  router.post(`/${version}/confirm-herd-or-animal-to-report`, (req, res) => {
    const selected = req.body.selectedCattle

    if (!selected) {
      return res.render(`${version}/choose-a-herd-or-animal-to-report`, {
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
    return res.redirect(`/${version}/confirm-herd-or-animal-to-report`)
  })

  router.post(`/${version}/report-activity-type`, (req, res) => {
    const reportType = req.body.reportType
    req.session.data.reportType = reportType

    if (!reportType) {
      return res.render(`${version}/confirm-herd-or-animal-to-report`, {
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

    if (reportType === 'tb-test') {
      // Starting a new skin test report – reset per-report state
      req.session.data.skinTestEntries = null
      req.session.data.skinTestAddedEntries = null
      req.session.data.skinTestDay1Day = null
      req.session.data.skinTestDay1Month = null
      req.session.data.skinTestDay1Year = null
      req.session.data.skinTestDay2Day = null
      req.session.data.skinTestDay2Month = null
      req.session.data.skinTestDay2Year = null
      req.session.data.skinTestType = null
      req.session.data.currentSkinTestIndex = 0
      req.session.data.skinTestInProgress = true
      return res.redirect(`/${version}/skin-test-date`)
    }

    if (reportType === 'vaccination' || reportType === 'both') {
      return res.redirect(`/${version}/who-gave-the-vaccine`)
    }

    return res.redirect(`/${version}/report-summary`)
  })

  router.post(`/${version}/who-gave-the-vaccine`, (req, res) => {
    const administeredBy = req.body.administeredBy
    req.session.data.administeredBy = administeredBy
    req.session.data.firstName = req.body.firstName
    req.session.data.lastName = req.body.lastName
    req.session.data.theirRole = req.body.theirRole
    req.session.data.otherRole = req.body.otherRole

    if (!administeredBy) {
      return res.render(`${version}/who-gave-the-vaccine`, {
        errors: {
          administeredBy: { text: 'Select who gave the vaccine' }
        },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select who gave the vaccine', href: '#administeredBy' }]
        }
      })
    }

    return res.redirect(`/${version}/enter-vaccine-batch-details`)
  })

  router.post(`/${version}/enter-vaccination-date`, (req, res) => {
    req.session.data.vaccinationDateDay = req.body['vaccinationDate-day']
    req.session.data.vaccinationDateMonth = req.body['vaccinationDate-month']
    req.session.data.vaccinationDateYear = req.body['vaccinationDate-year']
    return res.redirect(`/${version}/enter-vaccine-batch-details`)
  })

  router.post(`/${version}/enter-vaccine-batch-details`, (req, res) => {
    req.session.data.batchNumber = req.body.batchNumber
    req.session.data.batchExpiryDateDay = req.body['batchExpiryDate-day']
    req.session.data.batchExpiryDateMonth = req.body['batchExpiryDate-month']
    req.session.data.batchExpiryDateYear = req.body['batchExpiryDate-year']
    return res.redirect(`/${version}/enter-diluent-batch-details`)
  })

  router.get(`/${version}/enter-diluent-batch-details`, (req, res) => {
    res.render(`${version}/enter-diluent-batch-details`)
  })

  router.post(`/${version}/enter-diluent-batch-details`, (req, res) => {
    req.session.data.diluentBatchNumber = req.body.diluentBatchNumber
    req.session.data.diluentBatchExpiryDateDay = req.body['diluentBatchExpiryDate-day']
    req.session.data.diluentBatchExpiryDateMonth = req.body['diluentBatchExpiryDate-month']
    req.session.data.diluentBatchExpiryDateYear = req.body['diluentBatchExpiryDate-year']
    // New: ask the vet whether they want to mark the vaccinated cattle
    // first or the unvaccinated cattle first. Reset any previous choice
    // so a new journey always starts fresh.
    req.session.data.vaccinationApproach = null
    req.session.data.markingPhase = null
    req.session.data.activeReviewGroup = null
    return res.redirect(`/${version}/vaccination-approach`)
  })

  // Approach chooser – the vet tells us whether they'll start by
  // marking the cattle that WERE vaccinated or the ones that were NOT.
  router.get(`/${version}/vaccination-approach`, (req, res) => {
    res.render(`${version}/vaccination-approach`)
  })

  router.post(`/${version}/vaccination-approach`, (req, res) => {
    const vaccinationApproach = req.body.vaccinationApproach
    req.session.data.vaccinationApproach = vaccinationApproach

    if (!vaccinationApproach) {
      return res.render(`${version}/vaccination-approach`, {
        errors: { vaccinationApproach: { text: 'Select which cattle you want to mark first' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select which cattle you want to mark first', href: '#vaccinationApproach' }]
        }
      })
    }

    // 'mark-vaccinated' starts on the vaccinated-selection phase (the
    // existing default). 'mark-not-vaccinated' skips straight to the
    // reasons phase so the vet can pick the exceptions and their
    // reasons in one go; remaining cattle are then bulk-confirmed as
    // vaccinated on the next screen.
    req.session.data.markingPhase = vaccinationApproach === 'mark-not-vaccinated'
      ? 'reasons'
      : 'vaccinated'
    req.session.data.activeReviewGroup = 'remaining'
    res.redirect(`/${version}/select-vaccinated-animals`)
  })

  // Confirmation between the first marking stage and handling the
  // remaining animals. Summarises what's been marked and, for the
  // "not-vaccinated-first" flow, tells the vet the remaining cattle
  // will be treated as vaccinated.
  function buildMarkingSummaryRows(req, version) {
    const animals = getReportingAnimals(req, version)
    const decisionMap = getDecisionMap(req.session.data)
    const groups = getReportingGroups(animals, decisionMap)
    const rows = []

    const statusLabels = {
      vaccinated: 'Vaccinated',
      'not-found': 'Not found',
      deceased: 'Deceased',
      'withdrawn-export': 'Withdrawn for export',
      'withdrawn-slaughter': 'Withdrawn for slaughter',
      'withdrawn-owner': 'Withdrawn by owner',
      other: 'Other reason'
    }

    Object.keys(statusLabels).forEach(function (key) {
      const count = (groups[key] || []).length
      if (count > 0) {
        rows.push({
          key: { text: statusLabels[key] },
          value: { text: String(count) }
        })
      }
    })

    return rows
  }

  router.get(`/${version}/vaccination-marked-confirm`, (req, res) => {
    const animals = getReportingAnimals(req, version)
    const decisionMap = getDecisionMap(req.session.data)
    const groups = getReportingGroups(animals, decisionMap)
    const totalAnimals = animals.length
    const countRemaining = groups.remaining.length
    const countMarked = totalAnimals - countRemaining

    res.render(`${version}/vaccination-marked-confirm`, {
      vaccinationApproach: req.session.data.vaccinationApproach || 'mark-vaccinated',
      totalAnimals,
      countMarked,
      countRemaining,
      summaryRows: buildMarkingSummaryRows(req, version)
    })
  })

  router.post(`/${version}/vaccination-marked-confirm`, (req, res) => {
    const confirmAction = req.body.confirmAction
    const approach = req.session.data.vaccinationApproach || 'mark-vaccinated'

    if (confirmAction === 'back') {
      return res.redirect(`/${version}/select-vaccinated-animals`)
    }

    const animals = getReportingAnimals(req, version)
    const decisionMap = getDecisionMap(req.session.data)
    const groups = getReportingGroups(animals, decisionMap)

    // No remaining cattle: go straight to the check-your-answers step.
    if (groups.remaining.length === 0) {
      req.session.data.vaccinatedCattle = groups.vaccinated.map(a => a.officialId)
      const otherReasons = req.session.data.otherReasons || {}
      req.session.data.remainingCattleUpdates = [
        { status: 'not-found', cattle: groups['not-found'].map(a => a.officialId) },
        { status: 'deceased', cattle: groups.deceased.map(a => a.officialId) },
        { status: 'withdrawn-export', cattle: groups['withdrawn-export'].map(a => a.officialId) },
        { status: 'withdrawn-slaughter', cattle: groups['withdrawn-slaughter'].map(a => a.officialId) },
        { status: 'withdrawn-owner', cattle: groups['withdrawn-owner'].map(a => a.officialId) },
        {
          status: 'other',
          cattle: groups.other.map(a => a.officialId),
          reasons: groups.other.reduce((acc, a) => {
            if (otherReasons[a.officialId]) acc[a.officialId] = otherReasons[a.officialId]
            return acc
          }, {})
        }
      ].filter(g => g.cattle.length)
      return res.redirect(`/${version}/check-report-answers`)
    }

    // Advance to the second marking stage. For the "mark-vaccinated"
    // approach we move to 'reasons'. For the "mark-not-vaccinated"
    // approach we move to 'vaccinated' so the vet can confirm the
    // remaining cattle are really vaccinated.
    req.session.data.markingPhase = approach === 'mark-not-vaccinated' ? 'vaccinated' : 'reasons'
    req.session.data.activeReviewGroup = 'remaining'
    res.redirect(`/${version}/select-vaccinated-animals`)
  })

  router.get(`/${version}/select-vaccinated-animals`, (req, res) => {
    req.session.data.markingPhase = req.session.data.markingPhase || 'vaccinated'
    req.session.data.activeReviewGroup = req.session.data.activeReviewGroup || 'remaining'
    return renderSelectVaccinatedAnimals(req, res, version)
  })

  router.post(`/${version}/select-vaccinated-animals`, (req, res) => {
    const animals = getReportingAnimals(req, version)
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
      return res.redirect(`/${version}/select-vaccinated-animals`)
    }

    if (markAction === 'continue-to-reasons') {
      // Route through the new confirmation page. The confirmation
      // POST then bumps us to the 'reasons' phase (or 'vaccinated'
      // for the inverse approach) and back to this screen.
      return res.redirect(`/${version}/vaccination-marked-confirm`)
    }

    // Inverse flow shortcut: the vet has finished marking the cattle
    // that were NOT vaccinated. Bulk-mark every remaining animal as
    // vaccinated and go to the confirmation page.
    if (markAction === 'bulk-vaccinate-remaining') {
      const decisionMap = { ...getDecisionMap(req.session.data) }
      const currentOtherReasons = { ...(req.session.data.otherReasons || {}) }
      animals.forEach(function (animal) {
        const id = animal.officialId
        if (!decisionMap[id] || decisionMap[id] === 'remaining') {
          decisionMap[id] = 'vaccinated'
          // Remove any stale "other" reason from a previous selection
          delete currentOtherReasons[id]
        }
      })
      req.session.data.cattleDecisions = decisionMap
      req.session.data.otherReasons = currentOtherReasons
      return res.redirect(`/${version}/vaccination-marked-confirm`)
    }

    if (markAction === 'continue') {
      const decisionMap = getDecisionMap(req.session.data)
      const groups = getReportingGroups(animals, decisionMap)

      if (groups.remaining.length) {
        return renderSelectVaccinatedAnimals(req, res, version, {
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

      return res.redirect(`/${version}/check-report-answers`)
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
      return res.redirect(`/${version}/select-vaccinated-animals`)
    }

    if (!selectedIds.length) {
      return renderSelectVaccinatedAnimals(req, res, version, {
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
      return res.redirect(`/${version}/select-vaccinated-animals`)
    }

    const finalStatus = req.session.data.markingPhase === 'vaccinated'
      ? 'vaccinated'
      : selectedStatus

    if (req.session.data.markingPhase === 'reasons' && !selectedStatus) {
      return renderSelectVaccinatedAnimals(req, res, version, {
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
      return renderSelectVaccinatedAnimals(req, res, version, {
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
    return res.redirect(`/${version}/select-vaccinated-animals`)
  })

  router.post(`/${version}/add-a-note`, (req, res) => {
    req.session.data.vaccinationNote = req.body.vaccinationNote
    return res.redirect(`/${version}/check-report-answers`)
  })

  router.post(`/${version}/submit-vaccination-report`, (req, res) => {
    return res.redirect(`/${version}/report-submitted`)
  })

  // One Login
  router.get(`/${version}/one-login`, function (req, res) {
    res.render(`${version}/one-login`)
  })

  router.get(`/${version}/one-login-email`, function (req, res) {
    res.render(`${version}/one-login-email`, { error: null })
  })

  router.post(`/${version}/one-login-email`, function (req, res) {
    const email = (req.body.email || '').trim()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    req.session.data.email = email

    if (!email) {
      return res.render(`${version}/one-login-email`, {
        error: 'Enter your email address'
      })
    }

    if (!emailPattern.test(email)) {
      return res.render(`${version}/one-login-email`, {
        error: 'Enter an email address in the correct format, like name@example.com'
      })
    }

    res.redirect(`/${version}/one-login-password`)
  })

  router.get(`/${version}/one-login-password`, function (req, res) {
    res.render(`${version}/one-login-password`)
  })

  router.post(`/${version}/one-login-password`, function (req, res) {
    const password = (req.body.password || '').trim()

    req.session.data.password = password

    if (!password) {
      return res.render(`${version}/one-login-password`, {
        error: 'Enter your password'
      })
    }

    req.session.data.userName = 'Alex Taylor'
    res.redirect(`/${version}/dashboard`)
  })

  // ---------------------------------------------------------------------------
  // Download list routes
  // ---------------------------------------------------------------------------
  router.get(`/${version}/check-list-details`, function (req, res) {
    res.render(`${version}/check-list-details`)
  })

  router.post(`/${version}/check-list-details`, function (req, res) {
    let fields = req.body.fields || []

    if (!Array.isArray(fields)) {
      fields = [fields]
    }

    req.session.data.fields = fields.filter(field => field && field !== '_unchecked')
    req.session.data.sortBy = req.body.sortBy || 'Ear-tag number'
    req.session.data.sortDirection = req.body.sortDirection || 'asc'

    // Record the prepared vaccination list against the current farm
    // so the dashboard's "Work in progress" can offer the vet a way
    // back to view / edit / reprint, or to report vaccinations for
    // the same cattle. We only mark this for the vaccinate-list
    // journey (the same template is reused by the skin-test list
    // path which has its own completion record).
    const herd = req.session.data.herd
    const cph = herd && herd.cph
    if (cph && req.session.data.listType === 'Vaccinate cattle') {
      const existing = Array.isArray(req.session.data.vaccinationListPrepared)
        ? req.session.data.vaccinationListPrepared.filter(function (r) { return r && r.cph !== cph })
        : []
      existing.push({ cph, preparedAt: new Date().toISOString() })
      req.session.data.vaccinationListPrepared = existing
    }

    res.redirect(`/${version}/download-list`)
  })

  router.get(`/${version}/prepare-list-download`, function (req, res) {
    res.render(`${version}/prepare-list-download`)
  })

  router.post(`/${version}/prepare-list-download`, function (req, res) {
    const downloadFormat = req.body.downloadFormat

    req.session.data.listType = req.session.data.listType || 'Vaccinate cattle'

    if (!downloadFormat) {
      return res.render(`${version}/prepare-list-download`, {
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

    res.redirect(`/${version}/check-list-details`)
  })

  router.post(`/${version}/download-list/setup`, function (req, res) {
    req.session.data.listType = req.body.listType || req.session.data.listType || 'Vaccinate cattle'

    if (!normaliseFields(req.session.data.fields).length) {
      req.session.data.fields = availableListColumns
    }

    req.session.data.downloadFormat = req.session.data.downloadFormat || 'pdf'
    req.session.data.sortBy = req.session.data.sortBy || 'Ear-tag number'
    req.session.data.sortDirection = req.session.data.sortDirection || 'asc'
    req.session.data.previewOptions = req.session.data.previewOptions || ['show-last-five', ...availableListColumns]

    // Branch into the skin-test prepare-list flow when the vet has said
    // they'll give a skin test on this visit
    if (req.session.data.listType === 'Give skin test') {
      return res.redirect(`/${version}/skin-test-list`)
    }

    res.redirect(`/${version}/download-list`)
  })

  router.post(`/${version}/download-list`, function (req, res) {
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

    res.redirect(`/${version}/download-list`)
  })

  router.get(`/${version}/download-list/reset`, function (req, res) {
    const fields = normaliseFields(req.session.data.fields)

    req.session.data.downloadFormat = req.session.data.downloadFormat || 'pdf'
    req.session.data.previewTextSize = 'standard'
    req.session.data.previewOrientation = 'portrait'
    req.session.data.previewSpacing = 'standard'
    req.session.data.previewOptions = ['show-last-five', ...fields]

    res.redirect(`/${version}/download-list`)
  })

  router.get(`/${version}/download-list`, function (req, res) {
    const selectedCattle = req.session.data.selectedCattle
    const fields = normaliseFields(req.session.data.fields)
    const sortBy = req.session.data.sortBy || 'Ear-tag number'
    const sortDirection = req.session.data.sortDirection || 'asc'
    const downloadFormat = req.session.data.downloadFormat || 'pdf'
    const animals = sortAnimals(getAnimalsForSelection(selectedCattle, version), sortBy, sortDirection)
    const previewSettings = getPreviewSettings(req.session.data, fields)

    res.render(`${version}/download-list`, {
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

  // ---------------------------------------------------------------------------
  // Dashboard route – shows Start new work + Continue existing work
  // ---------------------------------------------------------------------------
  router.get(`/${version}/dashboard`, function (req, res) {
    const savedBanner = req.session.data.savedBanner
    // Show the banner once, then clear it
    if (savedBanner) {
      req.session.data.savedBanner = null
    }

    // The dashboard groups MY work by FARM. We only show real
    // session-tracked work – no demo / placeholder rows. Every entry
    // here is something the current vet has actually started or
    // finished in this session.
    const farmTasksByCph = {}
    function ensureFarmEntry(farm, cph, user) {
      if (!farmTasksByCph[cph]) {
        farmTasksByCph[cph] = {
          farm,
          cph,
          user: user || 'You',
          tasks: []
        }
      }
      return farmTasksByCph[cph]
    }

    const currentUser = (req.session.data && req.session.data.userName) || 'You'

    // Build a herd lookup for the prepared-list flags (which only
    // store CPH strings) so we can resolve the farm name + cattle
    // count for the dashboard row.
    function lookupHerd(cph) {
      const live = req.session.data.herd
      if (live && live.cph === cph) return live
      return herdData[cph] || { farm: 'Selected farm', cph }
    }

    // 1. In-progress skin test report (live mid-flow data).
    if (req.session.data.skinTestInProgress && req.session.data.herd) {
      const herd = req.session.data.herd
      const phase = req.session.data.currentSkinTestPhase || 'sicct'
      const resumeHref = phase === 'diva'
        ? `/${version}/skin-test-diva`
        : `/${version}/skin-test-measurements`
      ensureFarmEntry(herd.farm, herd.cph, currentUser).tasks.push({
        key: 'report-skin-test',
        title: 'Report skin test results' + (phase === 'diva' ? ' (DIVA)' : ''),
        status: 'In progress',
        actionText: 'Continue recording results',
        href: resumeHref
      })
    }

    // 2. Prepared skin-test lists – the only "ready to do" task on
    //    the dashboard is the matching report. View / edit / reprint
    //    of the list itself lives on the farm-tasks page that the
    //    farm row links to.
    const preparedSkinTest = Array.isArray(req.session.data.skinTestListPrepared)
      ? req.session.data.skinTestListPrepared
      : []
    preparedSkinTest.forEach(function (record) {
      const herd = lookupHerd(record.cph)
      ensureFarmEntry(herd.farm, herd.cph, currentUser).tasks.push({
        key: 'report-skin-test',
        title: 'Report skin test results',
        description: 'Enter Day 1 and Day 2 measurements for each animal.',
        status: 'Ready',
        actionText: 'Report skin test results',
        href: `/${version}/farm-tasks/resume?cph=` + encodeURIComponent(record.cph)
          + '&task=report-skin-test'
      })
    })

    // 3. Prepared vaccination lists – same pattern, the only "ready"
    //    task is the BCG vaccination report.
    const preparedVaccination = Array.isArray(req.session.data.vaccinationListPrepared)
      ? req.session.data.vaccinationListPrepared
      : []
    preparedVaccination.forEach(function (record) {
      const herd = lookupHerd(record.cph)
      ensureFarmEntry(herd.farm, herd.cph, currentUser).tasks.push({
        key: 'report-vaccinations',
        title: 'Report BCG vaccinations',
        description: 'Record BCG vaccinations you have completed at this farm.',
        status: 'Ready',
        actionText: 'Report BCG vaccinations',
        href: `/${version}/farm-tasks/resume?cph=` + encodeURIComponent(record.cph)
          + '&task=report-vaccinations'
      })
    })

    // Convert the keyed dictionary back to an ordered list, with a
    // top-level summary so each farm row reads cleanly on the dashboard.
    // When the farm has a single task, the summary is the task title +
    // its description so the row reads like a clear "this is the next
    // thing to do" prompt.
    const farmsInProgress = Object.keys(farmTasksByCph).map(function (cph) {
      const entry = farmTasksByCph[cph]
      const inProgressCount = entry.tasks.filter(function (t) {
        return t.status === 'In progress'
      }).length
      let summary
      if (entry.tasks.length === 1) {
        const t = entry.tasks[0]
        summary = t.title
      } else {
        summary = entry.tasks.length + ' tasks'
          + (inProgressCount > 0 ? ' · ' + inProgressCount + ' in progress' : '')
      }
      return Object.assign({}, entry, {
        summary,
        primaryDescription: entry.tasks.length === 1 ? (entry.tasks[0].description || null) : null,
        actionText: 'View tasks for ' + entry.farm,
        href: `/${version}/farm-tasks?cph=` + encodeURIComponent(cph)
      })
    })

    res.render(`${version}/dashboard`, {
      farmsInProgress
    })
  })

  // ---------------------------------------------------------------------------
  // Farm tasks – a per-farm task list reached from the dashboard. Shows
  // every task related to that farm in a single GOV.UK task list, so the
  // vet can see what's done, what's in progress, and what still needs
  // doing without hunting around the rest of the service.
  // ---------------------------------------------------------------------------
  router.get(`/${version}/farm-tasks`, function (req, res) {
    const cph = (req.query && req.query.cph) || (req.session.data && req.session.data.herd && req.session.data.herd.cph)
    if (!cph) {
      return res.redirect(`/${version}/dashboard`)
    }

    // Resolve the farm record. We try the live session selection first,
    // then fall back to the static herd dataset.
    const herdFromSession = req.session.data && req.session.data.herd
    const herd = (herdFromSession && herdFromSession.cph === cph)
      ? herdFromSession
      : (herdData[cph] || null)
    const farmName = (herd && herd.farm) || 'Selected farm'
    const currentUser = (req.session.data && req.session.data.userName) || 'You'

    // Build a clean per-farm task list from real session state. After
    // a list is prepared the only "ready to do" task is the matching
    // report. The prepared list itself is shown separately so the vet
    // can view, edit or reprint it without it cluttering the task
    // list.
    const tasks = []

    function resumeHref(taskKey) {
      return `/${version}/farm-tasks/resume?cph=` + encodeURIComponent(cph)
        + '&task=' + encodeURIComponent(taskKey)
    }

    // Skin test report still in progress (mid-flow).
    if (cph === (req.session.data.herd && req.session.data.herd.cph)
        && req.session.data.skinTestInProgress) {
      const phase = req.session.data.currentSkinTestPhase || 'sicct'
      const resumeFlowHref = phase === 'diva'
        ? `/${version}/skin-test-diva`
        : `/${version}/skin-test-measurements`
      tasks.push({
        title: 'Report skin test results' + (phase === 'diva' ? ' (DIVA)' : ''),
        status: 'In progress',
        actionText: 'Continue recording results',
        href: resumeFlowHref
      })
    }

    // Skin test list ready → only the "Report skin test results"
    // task is queued for this farm.
    const preparedSkinTest = Array.isArray(req.session.data.skinTestListPrepared)
      ? req.session.data.skinTestListPrepared
      : []
    const sicctRecord = preparedSkinTest.find(function (r) { return r && r.cph === cph })
    if (sicctRecord && !req.session.data.skinTestInProgress) {
      tasks.push({
        title: 'Report skin test results',
        status: 'Ready',
        actionText: 'Report skin test results',
        href: resumeHref('report-skin-test')
      })
    }

    // Vaccination list ready → only the "Report BCG vaccinations"
    // task is queued for this farm.
    const preparedVaccination = Array.isArray(req.session.data.vaccinationListPrepared)
      ? req.session.data.vaccinationListPrepared
      : []
    const vaxRecord = preparedVaccination.find(function (r) { return r && r.cph === cph })
    if (vaxRecord) {
      tasks.push({
        title: 'Report BCG vaccinations',
        status: 'Ready',
        actionText: 'Report BCG vaccinations',
        href: resumeHref('report-vaccinations')
      })
    }

    // Prepared lists shown separately (not as "tasks to do") so the
    // vet can view, edit or reprint without the list cluttering the
    // active task list. Each list type for "Both" produces its own
    // link.
    const preparedLists = []
    if (sicctRecord) {
      const types = Array.isArray(sicctRecord.types) ? sicctRecord.types : ['SICCT']
      types.forEach(function (testLabel) {
        preparedLists.push({
          title: testLabel + ' list of cattle for skin tests',
          actionText: 'View, edit or reprint the ' + testLabel + ' list',
          href: `/${version}/skin-test-list?sublist=` + (testLabel === 'DIVA' ? 'diva' : 'sicct')
        })
      })
    }
    if (vaxRecord) {
      preparedLists.push({
        title: 'List of cattle to vaccinate',
        actionText: 'View, edit or reprint the list',
        href: `/${version}/download-list`
      })
    }

    res.render(`${version}/farm-tasks`, {
      farmName,
      cph,
      currentUser,
      tasks,
      preparedLists
    })
  })

  // Resume endpoint – sets up the session for the chosen farm and task
  // and forwards the vet to the matching journey start. Used by the
  // "Continue ..." / "Start ..." links on /v1-1/farm-tasks so demo
  // tasks land somewhere meaningful instead of "#".
  router.get(`/${version}/farm-tasks/resume`, function (req, res) {
    const cph = (req.query && req.query.cph) || ''
    const task = (req.query && req.query.task) || ''
    if (!cph || !task) {
      return res.redirect(`/${version}/dashboard`)
    }

    // Load the herd into session so downstream pages have the data
    // they need (farm name in captions, CPH in summary lists, etc.).
    const herd = herdData[cph]
    if (herd) {
      req.session.data.selectedCattle = cph
      req.session.data.selectedCattleLabel = herd.farm
      req.session.data.herd = herd
    } else {
      // Unknown CPH – bounce to the dashboard rather than risk a half-
      // initialised journey.
      return res.redirect(`/${version}/dashboard`)
    }

    // Set the journey-specific state and redirect to the right entry
    // page. Mirrors what /v1-1/select-journey does, but keyed on the
    // task identifier we put on the farm-tasks page.
    switch (task) {
      case 'prepare-vaccinate':
        req.session.data.journey = 'prepare-vaccinate'
        req.session.data.listType = 'Vaccinate cattle'
        if (!normaliseFields(req.session.data.fields).length) {
          req.session.data.fields = availableListColumns
        }
        req.session.data.downloadFormat = req.session.data.downloadFormat || 'pdf'
        req.session.data.sortBy = req.session.data.sortBy || 'Ear-tag number'
        req.session.data.sortDirection = req.session.data.sortDirection || 'asc'
        req.session.data.previewOptions = req.session.data.previewOptions
          || ['show-last-five', ...availableListColumns]
        return res.redirect(`/${version}/download-list`)

      case 'report-vaccinations':
        req.session.data.journey = 'report-vaccination'
        req.session.data.reportType = 'vaccination'
        return res.redirect(`/${version}/who-gave-the-vaccine`)

      case 'prepare-skin-test':
        req.session.data.journey = 'prepare-skin-test'
        req.session.data.listType = 'Give skin test'
        req.session.data.prepareSkinTestType = null
        req.session.data.prepareSkinTestPhase = null
        return res.redirect(`/${version}/prepare-skin-test-type`)

      case 'report-skin-test':
        req.session.data.journey = 'report-skin-test'
        req.session.data.reportType = 'tb-test'
        // Keep any saved partial state so an in-progress report can
        // resume; only reset if there's nothing already in session for
        // this farm.
        if (!req.session.data.skinTestInProgress) {
          req.session.data.skinTestEntries = null
          req.session.data.skinTestAddedEntries = null
          req.session.data.skinTestDay1Day = null
          req.session.data.skinTestDay1Month = null
          req.session.data.skinTestDay1Year = null
          req.session.data.skinTestDay2Day = null
          req.session.data.skinTestDay2Month = null
          req.session.data.skinTestDay2Year = null
          req.session.data.skinTestType = null
          req.session.data.currentSkinTestIndex = 0
          req.session.data.skinTestInProgress = true
        }
        return res.redirect(`/${version}/skin-test-date`)

      default:
        return res.redirect(`/${version}/dashboard`)
    }
  })

  // ---------------------------------------------------------------------------
  // Unified journey selector – called from /v1-1/confirm-herd-or-animal.
  // The vet picks one of four journeys; we initialise state and redirect
  // into the matching flow.
  // ---------------------------------------------------------------------------
  // New page showing the four journey radios. The POST handler below
  // lives on /select-journey and sends the vet into the matching flow.
  router.get(`/${version}/select-visit-task`, function (req, res) {
    res.render(`${version}/select-visit-task`)
  })

  router.post(`/${version}/select-journey`, function (req, res) {
    const journey = req.body.journey
    req.session.data.journey = journey

    if (!journey) {
      return res.render(`${version}/select-visit-task`, {
        errors: { journey: { text: 'Select what you will do on this visit' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select what you will do on this visit', href: '#journey' }]
        }
      })
    }

    switch (journey) {
      case 'prepare-vaccinate':
        req.session.data.listType = 'Vaccinate cattle'
        if (!normaliseFields(req.session.data.fields).length) {
          req.session.data.fields = availableListColumns
        }
        req.session.data.downloadFormat = req.session.data.downloadFormat || 'pdf'
        req.session.data.sortBy = req.session.data.sortBy || 'Ear-tag number'
        req.session.data.sortDirection = req.session.data.sortDirection || 'asc'
        req.session.data.previewOptions = req.session.data.previewOptions
          || ['show-last-five', ...availableListColumns]
        return res.redirect(`/${version}/download-list`)

      case 'prepare-skin-test':
        req.session.data.listType = 'Give skin test'
        // Sequential flow: the vet picks the list type up front, then
        // formats that list. For "Both", they return through the
        // confirmation step to format the second list. Reset any prior
        // state so a new journey always starts clean.
        req.session.data.prepareSkinTestType = null
        req.session.data.prepareSkinTestPhase = null
        return res.redirect(`/${version}/prepare-skin-test-type`)

      case 'report-vaccination':
        req.session.data.reportType = 'vaccination'
        return res.redirect(`/${version}/who-gave-the-vaccine`)

      case 'report-skin-test':
        req.session.data.reportType = 'tb-test'
        // Reset per-report skin test state so a new report starts clean
        req.session.data.skinTestEntries = null
        req.session.data.skinTestAddedEntries = null
        req.session.data.skinTestDay1Day = null
        req.session.data.skinTestDay1Month = null
        req.session.data.skinTestDay1Year = null
        req.session.data.skinTestDay2Day = null
        req.session.data.skinTestDay2Month = null
        req.session.data.skinTestDay2Year = null
        req.session.data.skinTestType = null
        req.session.data.currentSkinTestIndex = 0
        req.session.data.skinTestInProgress = true
        return res.redirect(`/${version}/skin-test-date`)
    }

    // Unknown journey – send back to the confirm page
    return res.redirect(`/${version}/confirm-herd-or-animal`)
  })
}

// Register routes for each supported prototype version
registerVersionRoutes('v1-0')
registerVersionRoutes('v1-1')

// -----------------------------------------------------------------------------
// Skin test journey routes (V1-1 only)
// -----------------------------------------------------------------------------
function registerSkinTestRoutes(version) {
  const skinTestListColumns = ['Age', 'DOB', 'Sex', 'Breed']

  // Helpers --------------------------------------------------------------------

  function getSkinTestAnimals(req) {
    const selectedCattle = req.session.data.selectedCattle
    const sortBy = req.session.data.skinTestSortBy || 'Ear-tag number (last 5 digits)'
    const sortDirection = req.session.data.skinTestSortDirection || 'asc'
    // registerSkinTestRoutes is only registered for v1-1, so always pass 'v1-1'
    return sortAnimals(getAnimalsForSelection(selectedCattle, 'v1-1'), sortBy, sortDirection)
  }

  function blankEntry() {
    return {
      // Per-animal test-type override. The skin-test-type screen sets a
      // whole-journey default ('SICCT' | 'DIVA' | 'Both'), but the
      // measurements page lets the vet switch test on a per-cow basis
      // (for example, if one animal reacted and needs DIVA follow-up).
      // Values: 'SICCT' | 'DIVA' | 'Both'. Empty string falls back to
      // the journey-wide skinTestType.
      performedTest: '',
      // SICCT fields
      status: null,
      avianBeforeInjection: '',
      avianBeforeReading: '',
      avianReactionDescription: '',
      bovineBeforeInjection: '',
      bovineBeforeReading: '',
      bovineReactionDescription: '',
      avianAfter72Hours: '',
      bovineAfter72Hours: '',
      remarks: '',
      // Clinical fields captured alongside the skin measurement grid.
      // Only populated for SICCT and Both journeys – never for DIVA-only.
      reactionDescription: '',
      overallResult: '',          // 'negative' | 'positive' | 'inconclusive'
      // notDoneReason is now a radio value ('not-found' | 'deceased' |
      // 'withdrawn-export' | 'withdrawn-slaughter' | 'withdrawn-owner' |
      // 'other'). When 'other' is chosen the typed reason goes into
      // notDoneReasonOther.
      notDoneReason: '',
      notDoneReasonOther: '',
      // DIVA fields (used when skinTestType is 'DIVA' or 'Both')
      divaStatus: null,           // 'done' | 'not-done'
      divaResult: '',             // 'negative' | 'positive' | 'inconclusive'
      // DIVA is a bovine-only test. We capture the bovine skin thickness
      // at injection (Day 1) and 72 hours later (Day 2), plus a clinical
      // description of any reaction and free-text remarks specific to
      // the DIVA visit. `divaBovineBeforeInjection` / `divaBovineAfter72Hours`
      // are distinct from the SICCT bovine readings because, on the
      // combined "Both" journey, SICCT and DIVA each have their own
      // bovine measurement pair.
      divaBovineBeforeInjection: '',
      divaBovineAfter72Hours: '',
      divaReactionDescription: '',
      divaRemarks: '',
      divaNotDoneReason: '',
      divaNotDoneReasonOther: '',
      // Single consolidated notes field shown beneath the measurement +
      // DIVA sections. Replaces the old Remarks / DIVA remarks / extra
      // readings textareas so there's one clear place for extra info.
      additionalNotes: ''
    }
  }

  function getEntries(req) {
    const animals = getSkinTestAnimals(req)
    const existing = Array.isArray(req.session.data.skinTestEntries)
      ? req.session.data.skinTestEntries
      : []

    // Pre-compute duplicate flags the same way the printed list does – any
    // two animals whose last 4 digits match are flagged, so the vet can
    // tell them apart on the measurement screen.
    const lastFourCounts = {}
    animals.forEach(function (a) {
      const last4 = String(a.officialId || '').slice(-4)
      lastFourCounts[last4] = (lastFourCounts[last4] || 0) + 1
    })

    return animals.map((animal, index) => {
      const saved = existing[index] || {}
      const last4 = String(animal.officialId || '').slice(-4)
      return Object.assign(
        {},
        blankEntry(),
        saved,
        {
          officialId: animal.officialId,
          earTag: animal.officialId,
          earTagParts: formatEarTagParts(animal.officialId),
          breed: animal.breed,
          dob: animal.dob,
          sex: animal.sex,
          age: calculateAgeFromDob(animal.dob),
          isVaccinated: animal.vaccinationStatus === 'Vaccinated',
          isDuplicate: lastFourCounts[last4] > 1,
          index
        }
      )
    })
  }

  function getAddedEntries(req) {
    const added = Array.isArray(req.session.data.skinTestAddedEntries)
      ? req.session.data.skinTestAddedEntries
      : []
    const baseCount = getSkinTestAnimals(req).length
    return added.map((entry, offset) => Object.assign({}, entry, { index: baseCount + offset }))
  }

  // Return the entries that apply to a given test phase. For the
  // reporting journey we only loop through REACTORS – the animals the
  // vet ticked on the reactors page – so the measurement screens stay
  // focused on the small number of cattle that need detailed readings.
  // Each returned entry carries an `originalIndex` so POST handlers
  // can write back to the right position in the full skinTestEntries
  // array.
  //
  // We trust the vet's journey-wide test choice (SICCT / DIVA / Both):
  // every reactor goes through whichever phase loop is being shown.
  // For Both, each reactor goes through SICCT and then DIVA. The
  // vaccination-status filter that used to live here was over-stepping
  // and excluding genuine reactors – the same problem we hit on the
  // list-format page.
  // Phase-aware reactor helpers. For SICCT-only and DIVA-only journeys
  // there's a single reactor list. For "Both", each test (SICCT and
  // DIVA) gets its own reactor list because the same animal can react
  // to one but not the other. The active "current phase" is whichever
  // test the vet is being asked about right now.
  function getReactorsForPhase(req, phase) {
    const byPhase = req.session.data.skinTestReactorsByPhase || {}
    if (phase === 'diva' && Array.isArray(byPhase.diva)) return byPhase.diva
    if (phase === 'sicct' && Array.isArray(byPhase.sicct)) return byPhase.sicct
    // Fallback to the legacy single-list key for backwards compatibility
    return Array.isArray(req.session.data.skinTestReactors)
      ? req.session.data.skinTestReactors
      : []
  }

  function setReactorsForPhase(req, phase, ids) {
    const byPhase = Object.assign({}, req.session.data.skinTestReactorsByPhase || {})
    byPhase[phase] = ids
    req.session.data.skinTestReactorsByPhase = byPhase
    // Mirror to the legacy single key so any unrelated code that
    // still reads it sees the latest list.
    req.session.data.skinTestReactors = ids
  }

  function getCurrentReactorPhase(req) {
    const skinTestType = req.session.data.skinTestType || 'SICCT'
    if (skinTestType === 'DIVA') return 'diva'
    if (skinTestType === 'SICCT') return 'sicct'
    // Both – the active phase is whichever phase hasn't completed yet.
    // Default to the vet's chosen first order; flip once that phase
    // is in `completedSkinTestPhases`.
    const firstOrder = req.session.data.skinTestFirstOrder === 'diva' ? 'diva' : 'sicct'
    const completed = Array.isArray(req.session.data.completedSkinTestPhases)
      ? req.session.data.completedSkinTestPhases
      : []
    if (completed.indexOf(firstOrder) === -1) return firstOrder
    return firstOrder === 'sicct' ? 'diva' : 'sicct'
  }

  function getCurrentReactorPhaseLabel(req) {
    return getCurrentReactorPhase(req) === 'diva' ? 'DIVA' : 'SICCT'
  }

  function getEntriesForPhase(req, phase) {
    const all = getEntries(req)
    const reactorIds = getReactorsForPhase(req, phase)
    const reactorSet = new Set(reactorIds)
    return all
      .map(function (entry, originalIndex) {
        return Object.assign({}, entry, { originalIndex })
      })
      .filter(function (entry) {
        return reactorSet.has(entry.officialId)
      })
  }

  function entrySummary(allEntries) {
    return {
      total: allEntries.length,
      done: allEntries.filter(e => e.status === 'done').length,
      notDone: allEntries.filter(e => e.status === 'not-done').length,
      outstanding: allEntries.filter(e => !e.status).length
    }
  }

  function divaSummary(allEntries) {
    return {
      total: allEntries.length,
      done: allEntries.filter(e => e.divaStatus === 'done').length,
      notDone: allEntries.filter(e => e.divaStatus === 'not-done').length,
      outstanding: allEntries.filter(e => !e.divaStatus).length
    }
  }

  function buildPreviewSettings(req) {
    const previewOptions = Array.isArray(req.session.data.skinTestPreviewOptions)
      ? req.session.data.skinTestPreviewOptions
      : ['show-last-five', ...skinTestListColumns]
    const visibleColumns = skinTestListColumns.filter(field => previewOptions.includes(field))
    return {
      previewOptions,
      visibleColumns,
      emphasiseLastFive: previewOptions.includes('show-last-five')
    }
  }

  function formatDateParts(day, month, year) {
    if (!day || !month || !year) {
      return ''
    }
    return `${day}/${month}/${year}`
  }

  // Journey 1 – Prepare list of cattle for skin tests -------------------------

  // Pre-list step: pick which test the list is for (SICCT / DIVA / Both).
  // The vet then marks any cattle that won't be tested on the next step –
  // there's no separate vaccination-status mismatch warning.
  router.get(`/${version}/prepare-skin-test-type`, function (req, res) {
    res.render(`${version}/prepare-skin-test-type`)
  })

  router.post(`/${version}/prepare-skin-test-type`, function (req, res) {
    const prepareSkinTestType = req.body.prepareSkinTestType
    req.session.data.prepareSkinTestType = prepareSkinTestType

    if (!prepareSkinTestType) {
      return res.render(`${version}/prepare-skin-test-type`, {
        errors: { prepareSkinTestType: { text: 'Select which skin test you are preparing a list for' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select which skin test you are preparing a list for', href: '#prepareSkinTestType' }]
        }
      })
    }

    // Reset any not-tested / cattle-assignment state from a previous
    // run so a new journey always starts from a clean slate.
    req.session.data.prepareSkinTestUntested = null
    req.session.data.prepareSkinTestUntestedReasons = null
    req.session.data.prepareSkinTestUntestedReasonOthers = null
    req.session.data.currentPrepareUntestedIndex = 0
    req.session.data.prepareSkinTestAssignments = null
    req.session.data.prepareAssignMode = null
    req.session.data.prepareAssignFirstTest = null
    req.session.data.prepareAssignCurrentTest = null
    req.session.data.prepareAssignCompletedTests = []

    if (prepareSkinTestType === 'Both') {
      // For "Both", the vet first decides how to split the herd
      // between the SICCT and DIVA lists – auto (by vaccination
      // status) or manual.
      req.session.data.prepareSkinTestPhase = 'sicct'
      return res.redirect(`/${version}/prepare-skin-test-assign`)
    }

    // SICCT-only or DIVA-only: straight on to the "will all of the
    // cattle be tested?" gate.
    req.session.data.prepareSkinTestPhase = prepareSkinTestType === 'SICCT' ? 'sicct' : 'diva'
    res.redirect(`/${version}/prepare-skin-test-all`)
  })

  // --- "Will all of the cattle be tested?" decision page ---------------
  router.get(`/${version}/prepare-skin-test-all`, function (req, res) {
    if (!req.session.data.prepareSkinTestType) {
      return res.redirect(`/${version}/prepare-skin-test-type`)
    }
    const animals = getSkinTestAnimals(req)
    res.render(`${version}/prepare-skin-test-all`, {
      totalCattle: animals.length
    })
  })

  router.post(`/${version}/prepare-skin-test-all`, function (req, res) {
    const allCattleTested = req.body.allCattleTested
    req.session.data.allCattleTested = allCattleTested

    if (allCattleTested !== 'yes' && allCattleTested !== 'no') {
      const animals = getSkinTestAnimals(req)
      return res.render(`${version}/prepare-skin-test-all`, {
        totalCattle: animals.length,
        errors: { allCattleTested: { text: 'Select yes if all cattle will be tested, or no if some will not' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select yes if all cattle will be tested, or no if some will not', href: '#allCattleTested' }]
        }
      })
    }

    if (allCattleTested === 'yes') {
      // Reset the not-tested state so the list-format page shows every
      // animal on the farm. Nothing to confirm – skip the confirm
      // step entirely and go straight to the list-format page.
      req.session.data.prepareSkinTestUntested = []
      req.session.data.prepareSkinTestUntestedReasons = {}
      req.session.data.prepareSkinTestUntestedReasonOthers = {}
      return res.redirect(`/${version}/skin-test-list`)
    }

    res.redirect(`/${version}/prepare-skin-test-untested`)
  })

  // --- Prepare-list cattle assignment for "Both" ------------------------
  // When the vet picks "DIVA and SICCT" on prepare-skin-test-type they
  // come here to split the herd between the two lists. They can let
  // the system do it automatically (vaccinated → DIVA, unvaccinated →
  // SICCT) or pick the cattle for each test by hand.
  router.get(`/${version}/prepare-skin-test-assign`, function (req, res) {
    if (req.session.data.prepareSkinTestType !== 'Both') {
      return res.redirect(`/${version}/prepare-skin-test-type`)
    }
    res.render(`${version}/prepare-skin-test-assign`)
  })

  router.post(`/${version}/prepare-skin-test-assign`, function (req, res) {
    const prepareAssignMode = req.body.prepareAssignMode
    req.session.data.prepareAssignMode = prepareAssignMode

    if (prepareAssignMode !== 'auto' && prepareAssignMode !== 'manual') {
      return res.render(`${version}/prepare-skin-test-assign`, {
        errors: { prepareAssignMode: { text: 'Select how you want to assign cattle to each test' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select how you want to assign cattle to each test', href: '#prepareAssignMode' }]
        }
      })
    }

    if (prepareAssignMode === 'auto') {
      // Split by vaccination status without further vet input.
      const animals = getSkinTestAnimals(req)
      const sicct = animals.filter(a => a.vaccinationStatus !== 'Vaccinated').map(a => a.officialId)
      const diva = animals.filter(a => a.vaccinationStatus === 'Vaccinated').map(a => a.officialId)
      req.session.data.prepareSkinTestAssignments = { sicct, diva }
      req.session.data.prepareAssignCompletedTests = ['sicct', 'diva']
      return res.redirect(`/${version}/prepare-skin-test-all`)
    }

    // Manual – pick the order, then assign per-test.
    req.session.data.prepareSkinTestAssignments = { sicct: [], diva: [] }
    req.session.data.prepareAssignCompletedTests = []
    res.redirect(`/${version}/prepare-skin-test-assign-order`)
  })

  router.get(`/${version}/prepare-skin-test-assign-order`, function (req, res) {
    if (req.session.data.prepareAssignMode !== 'manual') {
      return res.redirect(`/${version}/prepare-skin-test-assign`)
    }
    res.render(`${version}/prepare-skin-test-assign-order`)
  })

  router.post(`/${version}/prepare-skin-test-assign-order`, function (req, res) {
    const prepareAssignFirstTest = req.body.prepareAssignFirstTest
    req.session.data.prepareAssignFirstTest = prepareAssignFirstTest

    if (prepareAssignFirstTest !== 'sicct' && prepareAssignFirstTest !== 'diva') {
      return res.render(`${version}/prepare-skin-test-assign-order`, {
        errors: { prepareAssignFirstTest: { text: 'Select which test you want to choose cattle for first' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select which test you want to choose cattle for first', href: '#prepareAssignFirstTest' }]
        }
      })
    }

    req.session.data.prepareAssignCurrentTest = prepareAssignFirstTest
    res.redirect(`/${version}/prepare-skin-test-assign-cattle`)
  })

  // The cattle picker shows the animals still up for grabs (in the
  // first pass that's everyone; in the second pass it's the cattle
  // that weren't ticked for the first test). The vet ticks the ones
  // they want on the active test's list.
  router.get(`/${version}/prepare-skin-test-assign-cattle`, function (req, res) {
    if (req.session.data.prepareAssignMode !== 'manual') {
      return res.redirect(`/${version}/prepare-skin-test-assign`)
    }
    const currentTest = req.session.data.prepareAssignCurrentTest
    if (currentTest !== 'sicct' && currentTest !== 'diva') {
      return res.redirect(`/${version}/prepare-skin-test-assign-order`)
    }
    const otherTest = currentTest === 'sicct' ? 'diva' : 'sicct'
    const completed = Array.isArray(req.session.data.prepareAssignCompletedTests)
      ? req.session.data.prepareAssignCompletedTests
      : []
    const isSecondPass = completed.indexOf(otherTest) !== -1
    const assignments = req.session.data.prepareSkinTestAssignments || { sicct: [], diva: [] }
    const otherAssigned = new Set(assignments[otherTest] || [])

    // First pass: every animal is on the table. Second pass: only the
    // animals not picked for the first test (i.e. not in otherAssigned).
    const allAnimals = getPrepareCandidateAnimals(req)
    const animals = isSecondPass
      ? allAnimals.filter(a => !otherAssigned.has(a.officialId))
      : allAnimals

    res.render(`${version}/prepare-skin-test-assign-cattle`, {
      currentTestLabel: currentTest === 'diva' ? 'DIVA' : 'SICCT',
      otherTestLabel: otherTest === 'diva' ? 'DIVA' : 'SICCT',
      isSecondPass,
      animals,
      selectedAssigned: assignments[currentTest] || [],
      backHref: isSecondPass
        ? `/${version}/prepare-skin-test-assign-cattle`
        : `/${version}/prepare-skin-test-assign-order`,
      sortBy: req.session.data.prepareSkinTestUntestedSortBy || 'Ear-tag number (last 5 digits)',
      sortDirection: req.session.data.prepareSkinTestUntestedSortDirection || 'asc'
    })
  })

  router.post(`/${version}/prepare-skin-test-assign-cattle`, function (req, res) {
    const currentTest = req.session.data.prepareAssignCurrentTest
    if (currentTest !== 'sicct' && currentTest !== 'diva') {
      return res.redirect(`/${version}/prepare-skin-test-assign-order`)
    }

    // Filter the Prototype Kit's "_unchecked" placeholder.
    const submitted = Array.isArray(req.body.assignedCattle)
      ? req.body.assignedCattle
      : (req.body.assignedCattle ? [req.body.assignedCattle] : [])
    const assigned = submitted.filter(function (id) {
      return id && id !== '_unchecked'
    })

    const assignments = Object.assign(
      { sicct: [], diva: [] },
      req.session.data.prepareSkinTestAssignments || {}
    )
    assignments[currentTest] = assigned
    req.session.data.prepareSkinTestAssignments = assignments

    const completed = Array.isArray(req.session.data.prepareAssignCompletedTests)
      ? req.session.data.prepareAssignCompletedTests.slice()
      : []
    if (completed.indexOf(currentTest) === -1) completed.push(currentTest)
    req.session.data.prepareAssignCompletedTests = completed

    const otherTest = currentTest === 'sicct' ? 'diva' : 'sicct'
    if (completed.indexOf(otherTest) === -1) {
      // Move on to the second test, with the remaining cattle.
      req.session.data.prepareAssignCurrentTest = otherTest
      return res.redirect(`/${version}/prepare-skin-test-assign-cattle`)
    }

    // Both tests assigned – continue to the existing flow.
    res.redirect(`/${version}/prepare-skin-test-all`)
  })

  // List-settings POST – persist the chosen sort and bounce back so
  // applying a new sort doesn't disturb the tick state on the main form.
  router.post(`/${version}/prepare-skin-test-assign-cattle/settings`, function (req, res) {
    req.session.data.prepareSkinTestUntestedSortBy = req.body.sortBy || 'Ear-tag number (last 5 digits)'
    req.session.data.prepareSkinTestUntestedSortDirection = req.body.sortDirection || 'asc'
    res.redirect(`/${version}/prepare-skin-test-assign-cattle`)
  })

  router.get(`/${version}/prepare-skin-test-assign-cattle/settings/reset`, function (req, res) {
    req.session.data.prepareSkinTestUntestedSortBy = 'Ear-tag number (last 5 digits)'
    req.session.data.prepareSkinTestUntestedSortDirection = 'asc'
    res.redirect(`/${version}/prepare-skin-test-assign-cattle`)
  })

  // --- Edit a single list's cattle assignment after the fact ------------
  // Reached from the "Change SICCT list" / "Change DIVA list" links on
  // the skin-test-list page. Lets the vet re-pick cattle for one test
  // without going through the whole two-pass assignment flow again.
  router.get(`/${version}/prepare-skin-test-assign-cattle/edit/:test`, function (req, res) {
    const test = req.params.test === 'diva' ? 'diva' : 'sicct'
    const otherTest = test === 'diva' ? 'sicct' : 'diva'
    const assignments = req.session.data.prepareSkinTestAssignments || { sicct: [], diva: [] }

    res.render(`${version}/prepare-skin-test-assign-cattle`, {
      currentTestLabel: test === 'diva' ? 'DIVA' : 'SICCT',
      otherTestLabel: otherTest === 'diva' ? 'DIVA' : 'SICCT',
      isSecondPass: false,
      isEditMode: true,
      editTest: test,
      animals: getPrepareCandidateAnimals(req),
      selectedAssigned: assignments[test] || [],
      backHref: `/${version}/skin-test-list`,
      sortBy: req.session.data.prepareSkinTestUntestedSortBy || 'Ear-tag number (last 5 digits)',
      sortDirection: req.session.data.prepareSkinTestUntestedSortDirection || 'asc'
    })
  })

  router.post(`/${version}/prepare-skin-test-assign-cattle/edit/:test`, function (req, res) {
    const test = req.params.test === 'diva' ? 'diva' : 'sicct'

    const submitted = Array.isArray(req.body.assignedCattle)
      ? req.body.assignedCattle
      : (req.body.assignedCattle ? [req.body.assignedCattle] : [])
    const assigned = submitted.filter(function (id) {
      return id && id !== '_unchecked'
    })

    const assignments = Object.assign(
      { sicct: [], diva: [] },
      req.session.data.prepareSkinTestAssignments || {}
    )
    assignments[test] = assigned
    req.session.data.prepareSkinTestAssignments = assignments

    // Make sure both tests are still flagged complete so the
    // skin-test-list page reads the assignments without bouncing
    // the vet back into the first-time flow.
    req.session.data.prepareAssignCompletedTests = ['sicct', 'diva']

    res.redirect(`/${version}/skin-test-list?sublist=` + (test === 'diva' ? 'diva' : 'sicct'))
  })

  // --- Prepare-list "not tested" picker --------------------------------
  // Mirrors the report-side untested flow: first the vet ticks every
  // animal that won't be tested on this visit, then loops through each
  // ticked animal to record a reason, then confirms the not-tested
  // list before moving on to the list-format settings page.
  //
  // The list of cattle on this page can be re-sorted via a "List
  // settings" panel (same pattern used on /v1-1/skin-test-list). The
  // chosen sort is held in session so it persists across submits.
  function getPrepareCandidateAnimals(req) {
    // Show every animal on the farm regardless of the chosen test
    // type. Whether a cow gets tested or not is the vet's call.
    const baseAnimals = getSkinTestAnimals(req).map(function (a) { return a })

    // Apply the user-chosen sort. Falls back to "last 5 digits" /
    // ascending if nothing has been picked yet.
    const sortBy = req.session.data.prepareSkinTestUntestedSortBy
      || 'Ear-tag number (last 5 digits)'
    const sortDirection = req.session.data.prepareSkinTestUntestedSortDirection || 'asc'
    const sorted = sortAnimals(baseAnimals, sortBy, sortDirection)

    // Enrich each animal with the same fields the table needs.
    const lastFourCounts = {}
    sorted.forEach(function (a) {
      const last4 = String(a.officialId || '').slice(-4)
      lastFourCounts[last4] = (lastFourCounts[last4] || 0) + 1
    })
    return sorted.map(function (a) {
      const last4 = String(a.officialId || '').slice(-4)
      return Object.assign({}, a, {
        earTagParts: formatEarTagParts(a.officialId),
        age: calculateAgeFromDob(a.dob),
        isDuplicate: lastFourCounts[last4] > 1,
        isVaccinated: a.vaccinationStatus === 'Vaccinated'
      })
    })
  }

  router.get(`/${version}/prepare-skin-test-untested`, function (req, res) {
    if (!req.session.data.prepareSkinTestType) {
      return res.redirect(`/${version}/prepare-skin-test-type`)
    }
    // The "Skip — every animal will be tested" link points here with
    // ?skip=1. Nothing to confirm – clear the not-tested state and
    // route straight to the list-format page.
    if (req.query && req.query.skip === '1') {
      req.session.data.prepareSkinTestUntested = []
      req.session.data.prepareSkinTestUntestedReasons = {}
      req.session.data.prepareSkinTestUntestedReasonOthers = {}
      return res.redirect(`/${version}/skin-test-list`)
    }
    const animals = getPrepareCandidateAnimals(req)
    const selectedUntested = Array.isArray(req.session.data.prepareSkinTestUntested)
      ? req.session.data.prepareSkinTestUntested
      : []
    res.render(`${version}/prepare-skin-test-untested`, {
      animals,
      selectedUntested,
      sortBy: req.session.data.prepareSkinTestUntestedSortBy || 'Ear-tag number (last 5 digits)',
      sortDirection: req.session.data.prepareSkinTestUntestedSortDirection || 'asc'
    })
  })

  // List-settings POST: persist the chosen sort and bounce back to the
  // mark-untested page. The vet's existing tick state is left alone.
  router.post(`/${version}/prepare-skin-test-untested/settings`, function (req, res) {
    req.session.data.prepareSkinTestUntestedSortBy = req.body.sortBy || 'Ear-tag number (last 5 digits)'
    req.session.data.prepareSkinTestUntestedSortDirection = req.body.sortDirection || 'asc'
    res.redirect(`/${version}/prepare-skin-test-untested`)
  })

  router.get(`/${version}/prepare-skin-test-untested/settings/reset`, function (req, res) {
    req.session.data.prepareSkinTestUntestedSortBy = 'Ear-tag number (last 5 digits)'
    req.session.data.prepareSkinTestUntestedSortDirection = 'asc'
    res.redirect(`/${version}/prepare-skin-test-untested`)
  })

  router.post(`/${version}/prepare-skin-test-untested`, function (req, res) {
    // The Prototype Kit injects a "_unchecked" placeholder when a
    // checkboxes group is submitted with nothing ticked. Filter it
    // out so an empty submission really comes through as an empty
    // list (and routes the vet to the confirm page, not the reason
    // loop with a non-existent id).
    const submitted = Array.isArray(req.body.untested)
      ? req.body.untested
      : (req.body.untested ? [req.body.untested] : [])
    const untested = submitted.filter(function (id) {
      return id && id !== '_unchecked'
    })

    req.session.data.prepareSkinTestUntested = untested

    // Prune stale reasons for animals the vet has unticked.
    const existingReasons = req.session.data.prepareSkinTestUntestedReasons || {}
    const existingOthers = req.session.data.prepareSkinTestUntestedReasonOthers || {}
    const prunedReasons = {}
    const prunedOthers = {}
    untested.forEach(function (id) {
      if (existingReasons[id]) prunedReasons[id] = existingReasons[id]
      if (existingOthers[id]) prunedOthers[id] = existingOthers[id]
    })
    req.session.data.prepareSkinTestUntestedReasons = prunedReasons
    req.session.data.prepareSkinTestUntestedReasonOthers = prunedOthers
    req.session.data.currentPrepareUntestedIndex = 0

    if (untested.length === 0) {
      // No cattle marked – nothing to confirm. Skip the confirm step
      // and go straight to the list-format page.
      return res.redirect(`/${version}/skin-test-list`)
    }
    res.redirect(`/${version}/prepare-skin-test-untested-reason/0`)
  })

  // Per-animal reason loop – one page per ticked animal.
  function getPrepareUntestedAnimals(req) {
    const ids = Array.isArray(req.session.data.prepareSkinTestUntested)
      ? req.session.data.prepareSkinTestUntested
      : []
    if (ids.length === 0) return []
    const idSet = new Set(ids)
    return getReportingAnimalsWithFlags(req).filter(a => idSet.has(a.officialId))
  }

  function renderPrepareUntestedReason(req, res, index, options) {
    const animals = getPrepareUntestedAnimals(req)
    const total = animals.length
    if (total === 0) return res.redirect(`/${version}/prepare-skin-test-untested`)

    const safeIndex = Math.max(0, Math.min(index, total - 1))
    const currentAnimal = animals[safeIndex]
    const reasons = req.session.data.prepareSkinTestUntestedReasons || {}
    const others = req.session.data.prepareSkinTestUntestedReasonOthers || {}

    const completedCount = animals.filter(a => reasons[a.officialId]).length
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0

    const backHref = safeIndex > 0
      ? `/${version}/prepare-skin-test-untested-reason/${safeIndex - 1}`
      : `/${version}/prepare-skin-test-untested`

    res.render(`${version}/prepare-skin-test-untested-reason`, {
      currentIndex: safeIndex,
      currentPosition: safeIndex + 1,
      totalUntested: total,
      completedCount,
      remainingCount: total - completedCount,
      progressPercent,
      currentAnimal,
      savedReason: reasons[currentAnimal.officialId] || '',
      savedReasonOther: others[currentAnimal.officialId] || '',
      backHref,
      errors: options && options.errors,
      errorSummary: options && options.errorSummary,
      formValues: (options && options.formValues) || {}
    })
  }

  router.get(`/${version}/prepare-skin-test-untested-reason`, function (req, res) {
    const resumeIndex = Number.isInteger(req.session.data.currentPrepareUntestedIndex)
      ? req.session.data.currentPrepareUntestedIndex
      : 0
    res.redirect(`/${version}/prepare-skin-test-untested-reason/${resumeIndex}`)
  })

  router.get(`/${version}/prepare-skin-test-untested-reason/:index`, function (req, res) {
    const animals = getPrepareUntestedAnimals(req)
    if (animals.length === 0) {
      return res.redirect(`/${version}/prepare-skin-test-untested`)
    }
    const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, animals.length - 1))
    req.session.data.currentPrepareUntestedIndex = index
    renderPrepareUntestedReason(req, res, index)
  })

  router.post(`/${version}/prepare-skin-test-untested-reason/:index`, function (req, res) {
    const animals = getPrepareUntestedAnimals(req)
    if (animals.length === 0) {
      return res.redirect(`/${version}/prepare-skin-test-untested`)
    }

    const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, animals.length - 1))
    const currentAnimal = animals[index]
    const reason = (req.body.reason || '').trim()
    const reasonOther = (req.body.reasonOther || '').trim()

    if (!reason) {
      return renderPrepareUntestedReason(req, res, index, {
        errors: { reason: { text: 'Select a reason this animal will not be tested' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select a reason this animal will not be tested', href: '#reason' }]
        },
        formValues: { reason, reasonOther }
      })
    }

    const reasons = Object.assign({}, req.session.data.prepareSkinTestUntestedReasons || {})
    const others = Object.assign({}, req.session.data.prepareSkinTestUntestedReasonOthers || {})
    reasons[currentAnimal.officialId] = reason
    if (reason === 'other') {
      others[currentAnimal.officialId] = reasonOther
    } else {
      delete others[currentAnimal.officialId]
    }
    req.session.data.prepareSkinTestUntestedReasons = reasons
    req.session.data.prepareSkinTestUntestedReasonOthers = others

    if (index < animals.length - 1) {
      const nextIndex = index + 1
      req.session.data.currentPrepareUntestedIndex = nextIndex
      return res.redirect(`/${version}/prepare-skin-test-untested-reason/${nextIndex}`)
    }

    req.session.data.currentPrepareUntestedIndex = animals.length - 1
    res.redirect(`/${version}/prepare-skin-test-untested-confirm`)
  })

  // --- Confirm the not-tested list before moving on to formatting ------
  const PREPARE_UNTESTED_REASON_LABELS = {
    'too-young': 'Cattle too young',
    'deceased': 'Cattle deceased',
    'withdrawn-export': 'Withdrawn for export',
    'withdrawn-slaughter': 'Withdrawn for slaughter',
    'withdrawn-owner': 'Withdrawn by the livestock owner',
    'other': 'Other reason'
  }

  router.get(`/${version}/prepare-skin-test-untested-confirm`, function (req, res) {
    const ids = Array.isArray(req.session.data.prepareSkinTestUntested)
      ? req.session.data.prepareSkinTestUntested
      : []
    const reasons = req.session.data.prepareSkinTestUntestedReasons || {}
    const others = req.session.data.prepareSkinTestUntestedReasonOthers || {}
    const idSet = new Set(ids)
    const untestedRows = getReportingAnimalsWithFlags(req)
      .filter(a => idSet.has(a.officialId))
      .map(function (a) {
        return {
          officialId: a.officialId,
          earTagParts: a.earTagParts,
          age: a.age,
          dob: a.dob,
          sex: a.sex,
          breed: a.breed,
          reason: reasons[a.officialId] || '',
          reasonLabel: PREPARE_UNTESTED_REASON_LABELS[reasons[a.officialId]] || 'No reason',
          reasonOther: reasons[a.officialId] === 'other' ? (others[a.officialId] || '') : ''
        }
      })

    res.render(`${version}/prepare-skin-test-untested-confirm`, {
      untestedRows
    })
  })

  router.post(`/${version}/prepare-skin-test-untested-confirm`, function (req, res) {
    res.redirect(`/${version}/skin-test-list`)
  })

  router.get(`/${version}/skin-test-list`, function (req, res) {
    const baseAnimals = getSkinTestAnimals(req)

    // Determine which sub-list we're currently preparing. For SICCT /
    // DIVA only, the phase is fixed. For "Both", the session phase
    // tells us whether we're on the SICCT list (step 1 of 2) or the
    // DIVA list (step 2 of 2). A ?sublist=sicct|diva query param
    // overrides this – used by the final "Both" confirmation page to
    // let the vet jump between the two prepared lists.
    const prepareSkinTestType = req.session.data.prepareSkinTestType || 'SICCT'
    const sublistOverride = req.query && req.query.sublist
    const sessionPhase = req.session.data.prepareSkinTestPhase
      || (prepareSkinTestType === 'DIVA' ? 'diva' : 'sicct')
    const prepareSkinTestPhase = (sublistOverride === 'sicct' || sublistOverride === 'diva')
      ? sublistOverride
      : sessionPhase
    const isBoth = prepareSkinTestType === 'Both'

    // Small helper so we can build a filtered preview for SICCT, DIVA,
    // or both phases without repeating the enrichment logic.
    const settings = buildPreviewSettings(req)
    const prepareUntestedIds = Array.isArray(req.session.data.prepareSkinTestUntested)
      ? req.session.data.prepareSkinTestUntested
      : []
    const prepareUntestedSet = new Set(prepareUntestedIds)
    // For the "Both" journey the vet has already split the herd into
    // SICCT and DIVA via /prepare-skin-test-assign – either auto (by
    // vaccination status) or manually. Use those assignments as the
    // canonical per-phase membership when present.
    const assignments = req.session.data.prepareSkinTestAssignments || null
    const hasAssignments = isBoth && assignments
      && Array.isArray(assignments.sicct) && Array.isArray(assignments.diva)
      && (assignments.sicct.length + assignments.diva.length > 0)
    function buildPreviewForPhase(phase) {
      const phaseAssignmentSet = hasAssignments
        ? new Set(assignments[phase] || [])
        : null
      const filtered = baseAnimals.filter(function (a) {
        if (prepareUntestedSet.has(a.officialId)) return false
        // For "Both" with assignments, the SICCT preview only shows
        // animals assigned to SICCT and the DIVA preview only shows
        // animals assigned to DIVA. Single-test journeys ignore this
        // and continue to use the not-tested filter alone.
        if (phaseAssignmentSet && !phaseAssignmentSet.has(a.officialId)) return false
        return true
      })
      const counts = {}
      filtered.forEach(function (a) {
        const last4 = String(a.officialId || '').slice(-4)
        counts[last4] = (counts[last4] || 0) + 1
      })
      const enriched = filtered.map(function (a) {
        const last4 = String(a.officialId || '').slice(-4)
        return Object.assign({}, a, {
          isDuplicate: counts[last4] > 1,
          isVaccinated: a.vaccinationStatus === 'Vaccinated'
        })
      })
      const rows = buildPreviewRows(enriched, settings.visibleColumns)
        .map(function (row, idx) {
          return Object.assign({}, row, {
            isDuplicate: enriched[idx].isDuplicate,
            isVaccinated: enriched[idx].isVaccinated
          })
        })
      return { rows, count: enriched.length }
    }

    // Build the previews for whichever list(s) the filter panel has
    // currently selected. "Both" renders two stacked preview tables;
    // SICCT / DIVA render a single preview.
    let sicctPreview = null
    let divaPreview = null
    if (isBoth || prepareSkinTestPhase === 'sicct') {
      sicctPreview = buildPreviewForPhase('sicct')
    }
    if (isBoth || prepareSkinTestPhase === 'diva') {
      divaPreview = buildPreviewForPhase('diva')
    }

    // Single-preview variables kept for backwards compatibility with
    // the existing template. For "Both", default to the SICCT preview
    // so the existing SICCT table renders first and the DIVA table is
    // appended via the new divaPreview block.
    const previewRows = (sicctPreview && sicctPreview.rows) || (divaPreview && divaPreview.rows) || []

    const downloadFormat = req.session.data.downloadFormat || 'pdf'

    res.render(`${version}/skin-test-list`, {
      previewRows,
      previewColumns: settings.visibleColumns,
      previewAllColumns: skinTestListColumns,
      previewOptions: settings.previewOptions,
      emphasiseLastFive: settings.emphasiseLastFive,
      downloadFormat,
      previewTextSize: req.session.data.skinTestPreviewTextSize || 'standard',
      previewOrientation: req.session.data.skinTestPreviewOrientation || 'portrait',
      previewSpacing: req.session.data.skinTestPreviewSpacing || 'standard',
      prepareSkinTestType,
      prepareSkinTestPhase,
      listTestLabel: prepareSkinTestPhase === 'diva' ? 'DIVA' : 'SICCT',
      isBothJourney: isBoth,
      // For "Both", show the step indicator so the vet sees there's a
      // second list still to format after this one.
      bothStepText: isBoth
        ? (prepareSkinTestPhase === 'sicct' ? 'Step 1 of 2' : 'Step 2 of 2')
        : null,
      sicctPreviewRows: sicctPreview && sicctPreview.rows,
      sicctPreviewCount: sicctPreview && sicctPreview.count,
      divaPreviewRows: divaPreview && divaPreview.rows,
      divaPreviewCount: divaPreview && divaPreview.count
    })
  })

  router.post(`/${version}/skin-test-list`, function (req, res) {
    const submitted = Array.isArray(req.body.previewOptions)
      ? req.body.previewOptions
      : (req.body.previewOptions ? [req.body.previewOptions] : [])
    const cleaned = submitted.filter(option => option && option !== '_unchecked')

    // Column options are restricted to the known skin-test columns; the
    // "show-last-five" flag is a separate preview option. Persist whatever
    // the user submitted so unchecking sticks.
    req.session.data.skinTestPreviewOptions = cleaned
    req.session.data.skinTestSortBy = req.body.sortBy || 'Ear-tag number (last 5 digits)'
    req.session.data.skinTestSortDirection = req.body.sortDirection || 'asc'
    req.session.data.downloadFormat = req.body.downloadFormat || 'pdf'
    req.session.data.skinTestPreviewTextSize = req.body.previewTextSize || 'standard'
    req.session.data.skinTestPreviewOrientation = req.body.previewOrientation || 'portrait'
    req.session.data.skinTestPreviewSpacing = req.body.previewSpacing || 'standard'

    res.redirect(`/${version}/skin-test-list`)
  })

  router.get(`/${version}/skin-test-list/reset`, function (req, res) {
    req.session.data.skinTestPreviewOptions = ['show-last-five', ...skinTestListColumns]
    req.session.data.skinTestSortBy = 'Ear-tag number (last 5 digits)'
    req.session.data.skinTestSortDirection = 'asc'
    req.session.data.downloadFormat = 'pdf'
    req.session.data.skinTestPreviewTextSize = 'standard'
    req.session.data.skinTestPreviewOrientation = 'portrait'
    req.session.data.skinTestPreviewSpacing = 'standard'
    res.redirect(`/${version}/skin-test-list`)
  })

  // Confirmation / success page for the prepare-skin-test-list journey.
  // For "Both", this is shown twice – once for SICCT, once for DIVA –
  // with a "Continue to the DIVA list" button after the first step.
  router.get(`/${version}/skin-test-list-confirmed`, function (req, res) {
    const prepareSkinTestType = req.session.data.prepareSkinTestType || 'SICCT'
    const prepareSkinTestPhase = req.session.data.prepareSkinTestPhase
      || (prepareSkinTestType === 'DIVA' ? 'diva' : 'sicct')
    const isBoth = prepareSkinTestType === 'Both'
    const listTestLabel = prepareSkinTestPhase === 'diva' ? 'DIVA' : 'SICCT'
    // Show the "Continue to DIVA list" action only after the SICCT
    // step of the "Both" journey is confirmed.
    const bothHasNextStep = isBoth && prepareSkinTestPhase === 'sicct'

    // Record (or update) the prepared list against the current farm
    // so the dashboard's "Work in progress" can offer the vet a way
    // back to view / edit / reprint the list, or report on the same
    // cattle. We only mark "Both" as fully prepared once the DIVA
    // step has been confirmed too (ie. there's no next step left).
    const herd = req.session.data.herd
    const cph = herd && herd.cph
    if (cph) {
      const types = isBoth ? ['SICCT', 'DIVA'] : [listTestLabel]
      const existing = Array.isArray(req.session.data.skinTestListPrepared)
        ? req.session.data.skinTestListPrepared.filter(function (r) { return r && r.cph !== cph })
        : []
      // For the SICCT step of a Both journey, hold off recording the
      // "ready" entry until the second list is confirmed – otherwise
      // the dashboard would show the DIVA list as ready before the
      // vet has actually formatted it.
      if (!bothHasNextStep) {
        existing.push({ cph, types, preparedAt: new Date().toISOString() })
      }
      req.session.data.skinTestListPrepared = existing
    }

    res.render(`${version}/skin-test-list-confirmed`, {
      prepareSkinTestType,
      prepareSkinTestPhase,
      listTestLabel,
      isBothJourney: isBoth,
      bothHasNextStep
    })
  })

  // Advance from the SICCT list to the DIVA list in the "Both" journey.
  // Resets the format settings so the DIVA list starts from the defaults.
  router.post(`/${version}/prepare-skin-test-next`, function (req, res) {
    if (req.session.data.prepareSkinTestType === 'Both'
        && req.session.data.prepareSkinTestPhase === 'sicct') {
      req.session.data.prepareSkinTestPhase = 'diva'
      // Reset format settings so the DIVA list starts from the defaults
      // – the vet can change them independently of the SICCT list.
      req.session.data.skinTestPreviewOptions = ['show-last-five', ...skinTestListColumns]
      req.session.data.skinTestSortBy = 'Ear-tag number (last 5 digits)'
      req.session.data.skinTestSortDirection = 'asc'
      req.session.data.downloadFormat = 'pdf'
      req.session.data.skinTestPreviewTextSize = 'standard'
      req.session.data.skinTestPreviewOrientation = 'portrait'
      req.session.data.skinTestPreviewSpacing = 'standard'
      return res.redirect(`/${version}/skin-test-list`)
    }
    res.redirect(`/${version}/skin-test-list-confirmed`)
  })

  // Journey 2 – Report skin test results --------------------------------------

  router.get(`/${version}/skin-test-date`, function (req, res) {
    res.render(`${version}/skin-test-date`)
  })

  router.post(`/${version}/skin-test-date`, function (req, res) {
    // Day 1 only on this page now – Day 2 is captured separately on
    // the next screen. No validation on this page – blank dates are
    // allowed through.
    req.session.data.skinTestDay1Day = (req.body['skinTestDay1-day'] || '').trim()
    req.session.data.skinTestDay1Month = (req.body['skinTestDay1-month'] || '').trim()
    req.session.data.skinTestDay1Year = (req.body['skinTestDay1-year'] || '').trim()

    const day1Multi = Array.isArray(req.body.skinTestDay1OverMultipleDays)
      ? req.body.skinTestDay1OverMultipleDays
      : [req.body.skinTestDay1OverMultipleDays].filter(Boolean)
    req.session.data.skinTestDay1OverMultipleDays = day1Multi.includes('yes') ? 'yes' : null

    res.redirect(`/${version}/skin-test-date-day-2`)
  })

  router.get(`/${version}/skin-test-date-day-2`, function (req, res) {
    res.render(`${version}/skin-test-date-day-2`)
  })

  router.post(`/${version}/skin-test-date-day-2`, function (req, res) {
    req.session.data.skinTestDay2Day = (req.body['skinTestDay2-day'] || '').trim()
    req.session.data.skinTestDay2Month = (req.body['skinTestDay2-month'] || '').trim()
    req.session.data.skinTestDay2Year = (req.body['skinTestDay2-year'] || '').trim()

    const day2Multi = Array.isArray(req.body.skinTestDay2OverMultipleDays)
      ? req.body.skinTestDay2OverMultipleDays
      : [req.body.skinTestDay2OverMultipleDays].filter(Boolean)
    req.session.data.skinTestDay2OverMultipleDays = day2Multi.includes('yes') ? 'yes' : null

    res.redirect(`/${version}/skin-test-type`)
  })

  router.get(`/${version}/skin-test-type`, function (req, res) {
    res.render(`${version}/skin-test-type`)
  })

  router.post(`/${version}/skin-test-type`, function (req, res) {
    const skinTestType = req.body.skinTestType
    req.session.data.skinTestType = skinTestType

    if (!skinTestType) {
      return res.render(`${version}/skin-test-type`, {
        errors: { skinTestType: { text: 'Select which test you did' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select which test you did', href: '#skinTestType' }]
        }
      })
    }

    // Reset phase-specific pointers + the reactor/untested state so a
    // brand-new choice always starts from a clean slate.
    req.session.data.currentSkinTestIndex = 0
    req.session.data.currentDivaIndex = 0
    req.session.data.completedSkinTestPhases = []
    req.session.data.skinTestFirstOrder = null
    req.session.data.skinTestReactors = null
    req.session.data.anyReactors = null
    req.session.data.skinTestUntested = null
    req.session.data.skinTestUntestedReasons = null

    // For "Both", ask the test-order question up-front — before the
    // vet sees any cattle list — so they make the high-level decision
    // first and the rest of the flow knows the order.
    if (skinTestType === 'Both') {
      return res.redirect(`/${version}/skin-test-both-order`)
    }

    // Otherwise: jump straight to the "did any cattle react?" gate.
    res.redirect(`/${version}/skin-test-reactors-any`)
  })

  // --- Reactor picker ---------------------------------------------------
  // The vet ticks which animals reacted (or ticks "No cattle reacted"
  // to skip the measurement loop entirely). Only reactors go through
  // the detailed SICCT / DIVA screens.
  function getReportingAnimalsWithFlags(req) {
    // The reactor picker shares its sort settings with the prepare-list
    // mark-untested page (same session keys), so the vet's preference
    // carries across the journey.
    const sortBy = req.session.data.prepareSkinTestUntestedSortBy
      || 'Ear-tag number (last 5 digits)'
    const sortDirection = req.session.data.prepareSkinTestUntestedSortDirection || 'asc'
    const sortedBase = sortAnimals(getSkinTestAnimals(req), sortBy, sortDirection)
    // Duplicate detection for the reactor / untested pickers so the
    // vet sees the same DUP flag they saw on the printed list.
    const lastFourCounts = {}
    sortedBase.forEach(function (a) {
      const last4 = String(a.officialId || '').slice(-4)
      lastFourCounts[last4] = (lastFourCounts[last4] || 0) + 1
    })
    return sortedBase.map(function (a) {
      const last4 = String(a.officialId || '').slice(-4)
      return Object.assign({}, a, {
        earTagParts: formatEarTagParts(a.officialId),
        age: calculateAgeFromDob(a.dob),
        isDuplicate: lastFourCounts[last4] > 1,
        isVaccinated: a.vaccinationStatus === 'Vaccinated'
      })
    })
  }

  // --- Step 1: decision page – "Did any cattle react?" -----------------
  // Splits the high-level decision out of the long selection list, so
  // the vet only sees the cattle table when they've already said "Yes".
  // For the "Both" journey the page is shown twice – once per test –
  // so the caption / heading reflects the current test (SICCT or DIVA).
  router.get(`/${version}/skin-test-reactors-any`, function (req, res) {
    const phase = getCurrentReactorPhase(req)
    const phaseLabel = getCurrentReactorPhaseLabel(req)
    const isBoth = req.session.data.skinTestType === 'Both'
    res.render(`${version}/skin-test-reactors-any`, {
      currentReactorPhase: phase,
      currentTestLabel: phaseLabel,
      isBothJourney: isBoth
    })
  })

  router.post(`/${version}/skin-test-reactors-any`, function (req, res) {
    const phase = getCurrentReactorPhase(req)
    const phaseLabel = getCurrentReactorPhaseLabel(req)
    const isBoth = req.session.data.skinTestType === 'Both'
    const anyReactors = req.body.anyReactors

    // Track the answer per phase so the second pass on a Both journey
    // doesn't carry the first phase's answer over.
    const anyReactorsByPhase = Object.assign({}, req.session.data.anyReactorsByPhase || {})
    anyReactorsByPhase[phase] = anyReactors
    req.session.data.anyReactorsByPhase = anyReactorsByPhase
    req.session.data.anyReactors = anyReactors

    if (anyReactors !== 'yes' && anyReactors !== 'no') {
      return res.render(`${version}/skin-test-reactors-any`, {
        currentReactorPhase: phase,
        currentTestLabel: phaseLabel,
        isBothJourney: isBoth,
        errors: { anyReactors: { text: 'Select yes if any cattle reacted, or no if none reacted' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select yes if any cattle reacted, or no if none reacted', href: '#anyReactors' }]
        }
      })
    }

    if (anyReactors === 'no') {
      // No reactors for this phase. Record an empty list against the
      // current phase, mark the phase as complete, and either move on
      // to the next phase (Both) or to the all-tested gate.
      setReactorsForPhase(req, phase, [])

      const allEntries = getEntries(req)
      const stored = Array.isArray(req.session.data.skinTestEntries)
        ? [...req.session.data.skinTestEntries]
        : []
      while (stored.length < allEntries.length) stored.push(blankEntry())
      req.session.data.skinTestEntries = stored

      const completed = Array.isArray(req.session.data.completedSkinTestPhases)
        ? req.session.data.completedSkinTestPhases.slice()
        : []
      if (completed.indexOf(phase) === -1) completed.push(phase)
      req.session.data.completedSkinTestPhases = completed

      // Both with the other phase still outstanding → ask the same
      // question again, this time for the other test.
      if (isBoth) {
        const otherPhase = phase === 'sicct' ? 'diva' : 'sicct'
        if (completed.indexOf(otherPhase) === -1) {
          return res.redirect(`/${version}/skin-test-reactors-any`)
        }
      }

      return res.redirect(`/${version}/skin-test-all-tested`)
    }

    // "Yes" → carry on to the cattle selection step.
    res.redirect(`/${version}/skin-test-reactors`)
  })

  // --- Step 2: selection page – "Which cattle reacted?" ----------------
  router.get(`/${version}/skin-test-reactors`, function (req, res) {
    const phase = getCurrentReactorPhase(req)
    const phaseLabel = getCurrentReactorPhaseLabel(req)
    const isBoth = req.session.data.skinTestType === 'Both'
    const anyReactorsByPhase = req.session.data.anyReactorsByPhase || {}

    // Skip straight back to the decision page if the vet hasn't
    // answered the high-level question for this phase yet.
    if (anyReactorsByPhase[phase] !== 'yes') {
      return res.redirect(`/${version}/skin-test-reactors-any`)
    }
    const animals = getReportingAnimalsWithFlags(req)
    if (!animals.length) {
      return res.redirect(`/${version}/skin-test-type`)
    }
    const selectedReactors = getReactorsForPhase(req, phase)
    res.render(`${version}/skin-test-reactors`, {
      animals,
      selectedReactors,
      currentReactorPhase: phase,
      currentTestLabel: phaseLabel,
      isBothJourney: isBoth,
      sortBy: req.session.data.prepareSkinTestUntestedSortBy || 'Ear-tag number (last 5 digits)',
      sortDirection: req.session.data.prepareSkinTestUntestedSortDirection || 'asc'
    })
  })

  // List-settings POST – persist the chosen sort + direction and bounce
  // back to the reactor page. The vet's existing tick state is left
  // alone (it's stored separately under skinTestReactors).
  router.post(`/${version}/skin-test-reactors/settings`, function (req, res) {
    req.session.data.prepareSkinTestUntestedSortBy = req.body.sortBy || 'Ear-tag number (last 5 digits)'
    req.session.data.prepareSkinTestUntestedSortDirection = req.body.sortDirection || 'asc'
    res.redirect(`/${version}/skin-test-reactors`)
  })

  router.get(`/${version}/skin-test-reactors/settings/reset`, function (req, res) {
    req.session.data.prepareSkinTestUntestedSortBy = 'Ear-tag number (last 5 digits)'
    req.session.data.prepareSkinTestUntestedSortDirection = 'asc'
    res.redirect(`/${version}/skin-test-reactors`)
  })

  router.post(`/${version}/skin-test-reactors`, function (req, res) {
    const phase = getCurrentReactorPhase(req)
    const phaseLabel = getCurrentReactorPhaseLabel(req)
    const isBoth = req.session.data.skinTestType === 'Both'

    // Filter the Prototype Kit's "_unchecked" placeholder so an empty
    // submission really registers as zero reactors.
    const submittedReactors = Array.isArray(req.body.reactors)
      ? req.body.reactors
      : (req.body.reactors ? [req.body.reactors] : [])
    const reactors = submittedReactors.filter(function (id) {
      return id && id !== '_unchecked'
    })

    // Validation: the vet has already answered "Yes" on the previous
    // step, so they must tick at least one animal here. If they want
    // to record no reactors, they go back and select "No".
    if (reactors.length === 0) {
      const animals = getReportingAnimalsWithFlags(req)
      return res.render(`${version}/skin-test-reactors`, {
        animals,
        selectedReactors: [],
        currentReactorPhase: phase,
        currentTestLabel: phaseLabel,
        isBothJourney: isBoth,
        errors: { reactors: { text: 'Select at least one animal that reacted' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select at least one animal that reacted', href: '#reactor-1' }]
        }
      })
    }

    setReactorsForPhase(req, phase, reactors)

    // Reset the measurement pointer for this phase only so the loop
    // starts at the first reactor.
    if (phase === 'diva') {
      req.session.data.currentDivaIndex = 0
    } else {
      req.session.data.currentSkinTestIndex = 0
    }

    // Seed blank entries so each reactor has a row ready when the
    // measurement screens write back.
    const allEntries = getEntries(req)
    const stored = Array.isArray(req.session.data.skinTestEntries)
      ? [...req.session.data.skinTestEntries]
      : []
    while (stored.length < allEntries.length) stored.push(blankEntry())
    req.session.data.skinTestEntries = stored

    // Routing: head into the measurement loop for this phase.
    if (phase === 'diva') {
      req.session.data.currentSkinTestPhase = 'diva'
      return res.redirect(`/${version}/skin-test-diva/0`)
    }
    req.session.data.currentSkinTestPhase = 'sicct'
    res.redirect(`/${version}/skin-test-measurements/0`)
  })

  // --- "Were all of the cattle tested?" gate page -----------------------
  // Sits between the reactor flow and the mark-untested page so the vet
  // doesn't have to scan the long animal table when every cow was
  // actually tested. Mirrors the prepare-side prepare-skin-test-all gate.
  router.get(`/${version}/skin-test-all-tested`, function (req, res) {
    const animals = getSkinTestAnimals(req)
    res.render(`${version}/skin-test-all-tested`, {
      totalCattle: animals.length
    })
  })

  router.post(`/${version}/skin-test-all-tested`, function (req, res) {
    const allCattleTestedReport = req.body.allCattleTestedReport
    req.session.data.allCattleTestedReport = allCattleTestedReport

    if (allCattleTestedReport !== 'yes' && allCattleTestedReport !== 'no') {
      const animals = getSkinTestAnimals(req)
      return res.render(`${version}/skin-test-all-tested`, {
        totalCattle: animals.length,
        errors: { allCattleTestedReport: { text: 'Select yes if all cattle were tested, or no if some were not' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select yes if all cattle were tested, or no if some were not', href: '#allCattleTestedReport' }]
        }
      })
    }

    if (allCattleTestedReport === 'yes') {
      // Every animal tested – clear any prior untested state and
      // skip the mark-untested page entirely.
      req.session.data.skinTestUntested = []
      req.session.data.skinTestUntestedReasons = {}
      req.session.data.skinTestUntestedReasonOthers = {}
      return res.redirect(`/${version}/skin-test-confirmation`)
    }

    res.redirect(`/${version}/skin-test-untested`)
  })

  // --- Untested picker --------------------------------------------------
  // After the reactor loop, the vet ticks any remaining animals that
  // were not tested on this visit and picks a reason for each. Any
  // animal left unticked is treated as a "clear" (negative) result.
  router.get(`/${version}/skin-test-untested`, function (req, res) {
    // getReportingAnimalsWithFlags already applies the user's chosen
    // sort (it reads prepareSkinTestUntestedSortBy / Direction), so
    // the table is ordered by the time we filter out reactors below.
    const allAnimals = getReportingAnimalsWithFlags(req)
    const sicctReactorIds = getReactorsForPhase(req, 'sicct')
    const divaReactorIds = getReactorsForPhase(req, 'diva')
    const reactorSet = new Set([...sicctReactorIds, ...divaReactorIds])
    const remaining = allAnimals.filter(function (a) { return !reactorSet.has(a.officialId) })
    const selectedUntested = Array.isArray(req.session.data.skinTestUntested)
      ? req.session.data.skinTestUntested
      : []
    const untestedReasons = req.session.data.skinTestUntestedReasons || {}

    // Back link always returns to the "were all of the cattle tested?"
    // gate, so the vet can flip Yes/No without juggling state.
    const backHref = `/${version}/skin-test-all-tested`

    res.render(`${version}/skin-test-untested`, {
      animals: remaining,
      selectedUntested,
      untestedReasons,
      backHref,
      sortBy: req.session.data.prepareSkinTestUntestedSortBy || 'Ear-tag number (last 5 digits)',
      sortDirection: req.session.data.prepareSkinTestUntestedSortDirection || 'asc'
    })
  })

  // List-settings POST – persists the chosen sort to the same session
  // keys used on prepare-skin-test-untested + skin-test-reactors, so
  // the vet's preference carries across the whole journey.
  router.post(`/${version}/skin-test-untested/settings`, function (req, res) {
    req.session.data.prepareSkinTestUntestedSortBy = req.body.sortBy || 'Ear-tag number (last 5 digits)'
    req.session.data.prepareSkinTestUntestedSortDirection = req.body.sortDirection || 'asc'
    res.redirect(`/${version}/skin-test-untested`)
  })

  router.get(`/${version}/skin-test-untested/settings/reset`, function (req, res) {
    req.session.data.prepareSkinTestUntestedSortBy = 'Ear-tag number (last 5 digits)'
    req.session.data.prepareSkinTestUntestedSortDirection = 'asc'
    res.redirect(`/${version}/skin-test-untested`)
  })

  router.post(`/${version}/skin-test-untested`, function (req, res) {
    // The Prototype Kit injects a "_unchecked" placeholder when a
    // checkbox group is submitted empty. Filter it out so an empty
    // submission cleanly routes to the confirmation step (every
    // remaining animal stays marked as clear) rather than into the
    // reason loop with a non-existent id.
    const submitted = Array.isArray(req.body.untested)
      ? req.body.untested
      : (req.body.untested ? [req.body.untested] : [])
    const untested = submitted.filter(function (id) {
      return id && id !== '_unchecked'
    })

    req.session.data.skinTestUntested = untested

    // Prune any stale reasons for animals that are no longer ticked as
    // untested (for example, the vet unticked one on this visit).
    const existingReasons = req.session.data.skinTestUntestedReasons || {}
    const existingOthers = req.session.data.skinTestUntestedReasonOthers || {}
    const prunedReasons = {}
    const prunedOthers = {}
    untested.forEach(function (id) {
      if (existingReasons[id]) prunedReasons[id] = existingReasons[id]
      if (existingOthers[id]) prunedOthers[id] = existingOthers[id]
    })
    req.session.data.skinTestUntestedReasons = prunedReasons
    req.session.data.skinTestUntestedReasonOthers = prunedOthers
    req.session.data.currentUntestedIndex = 0

    // Nothing ticked – every remaining animal is clear. Skip the
    // per-animal reason loop and go straight to the review page.
    if (untested.length === 0) {
      return res.redirect(`/${version}/skin-test-confirmation`)
    }

    // Otherwise, iterate the ticked cattle one at a time to pick
    // a reason for each.
    res.redirect(`/${version}/skin-test-untested-reason/0`)
  })

  // --- Untested reason loop --------------------------------------------
  // One page per ticked animal. The vet picks a reason ("not found",
  // "deceased", "withdrawn for export", etc.) and moves on to the next
  // until every untested animal has a reason recorded.
  function getUntestedAnimals(req) {
    const untestedIds = Array.isArray(req.session.data.skinTestUntested)
      ? req.session.data.skinTestUntested
      : []
    if (untestedIds.length === 0) return []
    const untestedSet = new Set(untestedIds)
    return getReportingAnimalsWithFlags(req).filter(function (a) {
      return untestedSet.has(a.officialId)
    })
  }

  function renderUntestedReason(req, res, index, options) {
    const untestedAnimals = getUntestedAnimals(req)
    const total = untestedAnimals.length
    if (total === 0) return res.redirect(`/${version}/skin-test-untested`)

    const safeIndex = Math.max(0, Math.min(index, total - 1))
    const currentAnimal = untestedAnimals[safeIndex]
    const reasons = req.session.data.skinTestUntestedReasons || {}
    const others = req.session.data.skinTestUntestedReasonOthers || {}

    // Progress counts only completed entries (those with a reason set).
    const completedCount = untestedAnimals.filter(function (a) { return reasons[a.officialId] }).length
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0

    const backHref = safeIndex > 0
      ? `/${version}/skin-test-untested-reason/${safeIndex - 1}`
      : `/${version}/skin-test-untested`

    res.render(`${version}/skin-test-untested-reason`, {
      currentIndex: safeIndex,
      currentPosition: safeIndex + 1,
      totalUntested: total,
      completedCount,
      remainingCount: total - completedCount,
      progressPercent,
      currentAnimal: Object.assign({}, currentAnimal, {
        dob: currentAnimal.dob,
        sex: currentAnimal.sex,
        breed: currentAnimal.breed
      }),
      savedReason: reasons[currentAnimal.officialId] || '',
      savedReasonOther: others[currentAnimal.officialId] || '',
      backHref,
      errors: options && options.errors,
      errorSummary: options && options.errorSummary,
      formValues: (options && options.formValues) || {}
    })
  }

  router.get(`/${version}/skin-test-untested-reason`, function (req, res) {
    const resumeIndex = Number.isInteger(req.session.data.currentUntestedIndex)
      ? req.session.data.currentUntestedIndex
      : 0
    res.redirect(`/${version}/skin-test-untested-reason/${resumeIndex}`)
  })

  router.get(`/${version}/skin-test-untested-reason/:index`, function (req, res) {
    const untestedAnimals = getUntestedAnimals(req)
    if (untestedAnimals.length === 0) {
      return res.redirect(`/${version}/skin-test-untested`)
    }
    const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, untestedAnimals.length - 1))
    req.session.data.currentUntestedIndex = index
    renderUntestedReason(req, res, index)
  })

  router.post(`/${version}/skin-test-untested-reason/:index`, function (req, res) {
    const untestedAnimals = getUntestedAnimals(req)
    if (untestedAnimals.length === 0) {
      return res.redirect(`/${version}/skin-test-untested`)
    }

    const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, untestedAnimals.length - 1))
    const currentAnimal = untestedAnimals[index]
    const reason = (req.body.reason || '').trim()
    const reasonOther = (req.body.reasonOther || '').trim()

    // Validation: a reason is required. The "other" text isn't required
    // in the prototype – the vet can leave it blank.
    if (!reason) {
      return renderUntestedReason(req, res, index, {
        errors: { reason: { text: 'Select a reason this animal was not tested' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select a reason this animal was not tested', href: '#reason' }]
        },
        formValues: { reason, reasonOther }
      })
    }

    // Persist the reason against the officialId so the confirmation
    // page and final report can surface it.
    const reasons = Object.assign({}, req.session.data.skinTestUntestedReasons || {})
    const others = Object.assign({}, req.session.data.skinTestUntestedReasonOthers || {})
    reasons[currentAnimal.officialId] = reason
    if (reason === 'other') {
      others[currentAnimal.officialId] = reasonOther
    } else {
      delete others[currentAnimal.officialId]
    }
    req.session.data.skinTestUntestedReasons = reasons
    req.session.data.skinTestUntestedReasonOthers = others

    // Advance to the next untested animal, or to the review page if
    // this was the last one.
    if (index < untestedAnimals.length - 1) {
      const nextIndex = index + 1
      req.session.data.currentUntestedIndex = nextIndex
      return res.redirect(`/${version}/skin-test-untested-reason/${nextIndex}`)
    }

    req.session.data.currentUntestedIndex = untestedAnimals.length - 1
    res.redirect(`/${version}/skin-test-confirmation`)
  })

  // "Which test first?" – only reached when the vet has chosen "Both"
  // on the skin-test-type page. The selection tells us which measurement
  // loop to start with; the other loop is triggered automatically once
  // the first is complete.
  router.get(`/${version}/skin-test-both-order`, function (req, res) {
    if (req.session.data.skinTestType !== 'Both') {
      return res.redirect(`/${version}/skin-test-type`)
    }
    res.render(`${version}/skin-test-both-order`)
  })

  router.post(`/${version}/skin-test-both-order`, function (req, res) {
    const skinTestFirstOrder = req.body.skinTestFirstOrder
    req.session.data.skinTestFirstOrder = skinTestFirstOrder

    if (!skinTestFirstOrder) {
      return res.render(`${version}/skin-test-both-order`, {
        errors: { skinTestFirstOrder: { text: 'Select which test you want to record first' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select which test you want to record first', href: '#skinTestFirstOrder' }]
        }
      })
    }

    req.session.data.currentSkinTestIndex = 0
    req.session.data.currentDivaIndex = 0
    req.session.data.completedSkinTestPhases = []

    // The order is recorded; now move on to the "did any cattle
    // react?" gate. The first measurement loop will follow once the
    // vet has picked their reactors.
    res.redirect(`/${version}/skin-test-reactors-any`)
  })

  function renderMeasurement(req, res, index, options) {
    // SICCT measurements apply to unvaccinated cattle only – the DIVA
    // phase handles vaccinated cattle on its own page.
    const entries = getEntriesForPhase(req, 'sicct')
    const total = entries.length
    const safeIndex = Math.max(0, Math.min(index, total - 1))
    const currentAnimal = entries[safeIndex]
    const completedCount = entries.filter(e => e.status === 'done' || e.status === 'not-done').length
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0

    const isBoth = req.session.data.skinTestType === 'Both'
    const firstOrder = req.session.data.skinTestFirstOrder || 'sicct'
    // For "Both", show the vet which phase of the pair they're on so the
    // "Step X of 2" indicator reflects their chosen order.
    const bothStep = isBoth
      ? (firstOrder === 'sicct' ? 'Step 1 of 2' : 'Step 2 of 2')
      : null

    // The natural "back" destination depends on whether the vet is in
    // the middle of the loop, at the start of the loop, or at the start
    // of a "Both" journey where DIVA was done first.
    const atStart = safeIndex === 0
    const divaAlreadyDone = (req.session.data.completedSkinTestPhases || []).includes('diva')
    const backHref = !atStart
      ? `/${version}/skin-test-measurements/${safeIndex - 1}`
      : (isBoth && divaAlreadyDone
          ? `/${version}/skin-test-diva/${Math.max((getEntriesForPhase(req, 'diva').length - 1), 0)}`
          : (isBoth ? `/${version}/skin-test-both-order` : `/${version}/skin-test-reactors`))

    res.render(`${version}/skin-test-measurements`, {
      currentIndex: safeIndex,
      currentPosition: safeIndex + 1,
      totalCattle: total,
      completedCount,
      remainingCount: total - completedCount,
      progressPercent,
      currentAnimal,
      savedEntry: currentAnimal,
      // Caption label – always "SICCT" on this page. The "Both" journey
      // is communicated via the step indicator and the inset banner.
      displayTestType: 'SICCT',
      isBothJourney: isBoth,
      bothStepText: bothStep,
      journeyTestType: req.session.data.skinTestType || 'SICCT',
      backHref,
      errors: options && options.errors,
      errorSummary: options && options.errorSummary,
      formValues: (options && options.formValues) || {}
    })
  }

  router.get(`/${version}/skin-test-measurements`, function (req, res) {
    const entries = getEntriesForPhase(req, 'sicct')
    if (!entries.length) {
      // No SICCT reactors – send the vet to the "were all of the
      // cattle tested?" gate (or back to the reactor step if reactors
      // haven't been chosen yet).
      if (!Array.isArray(req.session.data.skinTestReactors)) {
        return res.redirect(`/${version}/skin-test-reactors`)
      }
      return res.redirect(`/${version}/skin-test-all-tested`)
    }
    const resumeIndex = Number.isInteger(req.session.data.currentSkinTestIndex)
      ? Math.min(req.session.data.currentSkinTestIndex, entries.length - 1)
      : 0
    res.redirect(`/${version}/skin-test-measurements/${resumeIndex}`)
  })

  router.get(`/${version}/skin-test-measurements/:index`, function (req, res) {
    const entries = getEntriesForPhase(req, 'sicct')
    if (!entries.length) {
      // No SICCT reactors – send the vet to the "were all of the
      // cattle tested?" gate (or back to the reactor step if reactors
      // haven't been chosen yet).
      if (!Array.isArray(req.session.data.skinTestReactors)) {
        return res.redirect(`/${version}/skin-test-reactors`)
      }
      return res.redirect(`/${version}/skin-test-all-tested`)
    }
    const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, entries.length - 1))
    req.session.data.currentSkinTestIndex = index
    req.session.data.currentSkinTestPhase = 'sicct'
    renderMeasurement(req, res, index)
  })

  router.post(`/${version}/skin-test-measurements/:index`, function (req, res) {
    const entries = getEntriesForPhase(req, 'sicct')
    if (!entries.length) {
      // No SICCT reactors – send the vet to the "were all of the
      // cattle tested?" gate (or back to the reactor step if reactors
      // haven't been chosen yet).
      if (!Array.isArray(req.session.data.skinTestReactors)) {
        return res.redirect(`/${version}/skin-test-reactors`)
      }
      return res.redirect(`/${version}/skin-test-all-tested`)
    }

    const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, entries.length - 1))
    const loopAction = req.body.loopAction || 'next'

    // The "what happened with this animal?" radio is gone – the page
    // now always captures measurements (the vet only reaches it for
    // animals they ticked as reactors). Anything left blank is just
    // blank in the saved entry.
    // Map the filtered (SICCT-only) index back to the full skinTestEntries
    // array so we store the data against the right animal.
    const targetOriginalIndex = entries[index] && entries[index].originalIndex
    const allAnimalsCount = getEntries(req).length

    const entry = {
      status: 'done',
      performedTest: 'SICCT',
      // --- SICCT (Avian + Bovine, Pre + Post) -----------------------
      avianBeforeInjection: (req.body.avianBeforeInjection || '').trim(),
      avianAfter72Hours: (req.body.avianAfter72Hours || '').trim(),
      bovineBeforeInjection: (req.body.bovineBeforeInjection || '').trim(),
      bovineAfter72Hours: (req.body.bovineAfter72Hours || '').trim(),
      reactionDescription: (req.body.reactionDescription || '').trim(),
      overallResult: (req.body.overallResult || '').trim(),
      additionalNotes: (req.body.additionalNotes || '').trim()
    }

    // Persist the updated entry against the underlying animal
    const stored = Array.isArray(req.session.data.skinTestEntries)
      ? [...req.session.data.skinTestEntries]
      : []
    while (stored.length < allAnimalsCount) {
      stored.push(blankEntry())
    }
    stored[targetOriginalIndex] = Object.assign({}, stored[targetOriginalIndex] || blankEntry(), entry)
    req.session.data.skinTestEntries = stored

    if (loopAction === 'save-exit') {
      req.session.data.currentSkinTestIndex = index
      req.session.data.currentSkinTestPhase = 'sicct'
      req.session.data.savedBanner = 'skin-test-report'
      req.session.data.skinTestInProgress = true
      return res.redirect(`/${version}/dashboard`)
    }

    if (loopAction === 'previous') {
      const previousIndex = Math.max(0, index - 1)
      req.session.data.currentSkinTestIndex = previousIndex
      return res.redirect(`/${version}/skin-test-measurements/${previousIndex}`)
    }

    // Default: move to the next cattle or to review
    if (index < entries.length - 1) {
      const nextIndex = index + 1
      req.session.data.currentSkinTestIndex = nextIndex
      return res.redirect(`/${version}/skin-test-measurements/${nextIndex}`)
    }

    // Reached the last SICCT cattle. Mark the SICCT phase complete.
    req.session.data.currentSkinTestIndex = entries.length - 1
    const completed = Array.isArray(req.session.data.completedSkinTestPhases)
      ? req.session.data.completedSkinTestPhases.slice()
      : []
    if (!completed.includes('sicct')) completed.push('sicct')
    req.session.data.completedSkinTestPhases = completed

    // For the "Both" journey, hand off to the DIVA reactor flow if
    // it's still outstanding. The vet picks DIVA reactors (which may
    // be a different set from the SICCT reactors), then enters DIVA
    // measurements for those animals.
    const isBoth = req.session.data.skinTestType === 'Both'
    if (isBoth && !completed.includes('diva')) {
      return res.redirect(`/${version}/skin-test-reactors-any`)
    }

    // All reactor measurements are captured – move on to the
    // "were all of the cattle tested?" question, which gates the
    // mark-untested step.
    res.redirect(`/${version}/skin-test-all-tested`)
  })

  // ---------------------------------------------------------------------------
  // DIVA loop – only reached when skinTestType is 'DIVA' or the DIVA phase
  // of 'Both'. The page is deliberately separate from the SICCT skin
  // measurement page so that layout can stay untouched.
  // ---------------------------------------------------------------------------

  function renderDivaMeasurement(req, res, index, options) {
    // DIVA applies to vaccinated cattle only.
    const entries = getEntriesForPhase(req, 'diva')
    const total = entries.length
    const safeIndex = Math.max(0, Math.min(index, total - 1))
    const currentAnimal = entries[safeIndex]
    const completedCount = entries.filter(e => e.divaStatus === 'done' || e.divaStatus === 'not-done').length
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0

    const isBoth = req.session.data.skinTestType === 'Both'
    const firstOrder = req.session.data.skinTestFirstOrder || 'sicct'
    const bothStep = isBoth
      ? (firstOrder === 'diva' ? 'Step 1 of 2' : 'Step 2 of 2')
      : null

    const atStart = safeIndex === 0
    const sicctAlreadyDone = (req.session.data.completedSkinTestPhases || []).includes('sicct')
    const backHref = !atStart
      ? `/${version}/skin-test-diva/${safeIndex - 1}`
      : (isBoth && sicctAlreadyDone
          ? `/${version}/skin-test-measurements/${Math.max((getEntriesForPhase(req, 'sicct').length - 1), 0)}`
          : (isBoth ? `/${version}/skin-test-both-order` : `/${version}/skin-test-reactors`))

    res.render(`${version}/skin-test-diva`, {
      currentIndex: safeIndex,
      currentPosition: safeIndex + 1,
      totalCattle: total,
      completedCount,
      remainingCount: total - completedCount,
      progressPercent,
      currentAnimal,
      savedEntry: currentAnimal,
      displayTestType: 'DIVA',
      isBothJourney: isBoth,
      bothStepText: bothStep,
      backHref,
      errors: options && options.errors,
      errorSummary: options && options.errorSummary,
      formValues: (options && options.formValues) || {}
    })
  }

  router.get(`/${version}/skin-test-diva`, function (req, res) {
    const entries = getEntriesForPhase(req, 'diva')
    if (!entries.length) {
      // No DIVA reactors – same fallback path as the SICCT guard.
      if (!Array.isArray(req.session.data.skinTestReactors)) {
        return res.redirect(`/${version}/skin-test-reactors`)
      }
      return res.redirect(`/${version}/skin-test-all-tested`)
    }
    const resumeIndex = Number.isInteger(req.session.data.currentDivaIndex)
      ? Math.min(req.session.data.currentDivaIndex, entries.length - 1)
      : 0
    res.redirect(`/${version}/skin-test-diva/${resumeIndex}`)
  })

  router.get(`/${version}/skin-test-diva/:index`, function (req, res) {
    const entries = getEntriesForPhase(req, 'diva')
    if (!entries.length) {
      // No DIVA reactors – same fallback path as the SICCT guard.
      if (!Array.isArray(req.session.data.skinTestReactors)) {
        return res.redirect(`/${version}/skin-test-reactors`)
      }
      return res.redirect(`/${version}/skin-test-all-tested`)
    }
    const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, entries.length - 1))
    req.session.data.currentDivaIndex = index
    req.session.data.currentSkinTestPhase = 'diva'
    renderDivaMeasurement(req, res, index)
  })

  router.post(`/${version}/skin-test-diva/:index`, function (req, res) {
    const entries = getEntriesForPhase(req, 'diva')
    if (!entries.length) {
      // No DIVA reactors – same fallback path as the SICCT guard.
      if (!Array.isArray(req.session.data.skinTestReactors)) {
        return res.redirect(`/${version}/skin-test-reactors`)
      }
      return res.redirect(`/${version}/skin-test-all-tested`)
    }

    const index = Math.max(0, Math.min(parseInt(req.params.index, 10) || 0, entries.length - 1))
    const loopAction = req.body.loopAction || 'next'
    // The "what happened with this animal?" radio is gone – the DIVA
    // page now always captures measurements (the vet only reaches it
    // for animals they ticked as reactors). Anything left blank is
    // simply blank in the saved entry.
    const divaBovineBeforeInjection = (req.body.divaBovineBeforeInjection || '').trim()
    const divaBovineAfter72Hours = (req.body.divaBovineAfter72Hours || '').trim()
    const divaReactionDescription = (req.body.divaReactionDescription || '').trim()
    const divaRemarks = (req.body.divaRemarks || '').trim()
    const divaResult = (req.body.divaResult || '').trim()
    const additionalNotes = (req.body.additionalNotes || '').trim()

    // Map the filtered DIVA-only index back to the full entries array.
    const targetOriginalIndex = entries[index] && entries[index].originalIndex
    const allAnimalsCount = getEntries(req).length

    // Persist the updated DIVA entry against the underlying animal.
    const stored = Array.isArray(req.session.data.skinTestEntries)
      ? [...req.session.data.skinTestEntries]
      : []
    while (stored.length < allAnimalsCount) {
      stored.push(blankEntry())
    }
    stored[targetOriginalIndex] = Object.assign({}, stored[targetOriginalIndex] || blankEntry(), {
      divaStatus: 'done',
      divaBovineBeforeInjection,
      divaBovineAfter72Hours,
      divaReactionDescription,
      divaRemarks,
      divaResult,
      additionalNotes,
      performedTest: 'DIVA'
    })
    req.session.data.skinTestEntries = stored

    if (loopAction === 'save-exit') {
      req.session.data.currentDivaIndex = index
      req.session.data.currentSkinTestPhase = 'diva'
      req.session.data.savedBanner = 'skin-test-report'
      req.session.data.skinTestInProgress = true
      return res.redirect(`/${version}/dashboard`)
    }

    if (loopAction === 'previous') {
      const previousIndex = Math.max(0, index - 1)
      req.session.data.currentDivaIndex = previousIndex
      return res.redirect(`/${version}/skin-test-diva/${previousIndex}`)
    }

    if (index < entries.length - 1) {
      const nextIndex = index + 1
      req.session.data.currentDivaIndex = nextIndex
      return res.redirect(`/${version}/skin-test-diva/${nextIndex}`)
    }

    // Last DIVA cattle saved. Mark the DIVA phase complete.
    req.session.data.currentDivaIndex = entries.length - 1
    const completed = Array.isArray(req.session.data.completedSkinTestPhases)
      ? req.session.data.completedSkinTestPhases.slice()
      : []
    if (!completed.includes('diva')) completed.push('diva')
    req.session.data.completedSkinTestPhases = completed

    // For the "Both" journey, hand off to the SICCT reactor flow if
    // it's still outstanding. The vet picks SICCT reactors (a fresh
    // list, separate from the DIVA reactors above) and enters SICCT
    // measurements for those animals.
    const isBoth = req.session.data.skinTestType === 'Both'
    if (isBoth && !completed.includes('sicct')) {
      return res.redirect(`/${version}/skin-test-reactors-any`)
    }

    // All reactor measurements captured – on to the "were all of the
    // cattle tested?" question, which gates the mark-untested step.
    res.redirect(`/${version}/skin-test-all-tested`)
  })

  // Interim confirmation ------------------------------------------------------

  router.get(`/${version}/skin-test-confirmation`, function (req, res) {
    const entries = getEntries(req)
    const addedEntries = getAddedEntries(req)
    const allEntries = entries.concat(addedEntries)
    const summary = entrySummary(allEntries)

    const day1Formatted = formatDateParts(
      req.session.data.skinTestDay1Day,
      req.session.data.skinTestDay1Month,
      req.session.data.skinTestDay1Year
    )
    const day2Formatted = formatDateParts(
      req.session.data.skinTestDay2Day,
      req.session.data.skinTestDay2Month,
      req.session.data.skinTestDay2Year
    )

    // Consume the one-shot "added another" banner
    const addedAnotherEarTag = req.session.data.addedAnotherEarTag || null
    if (addedAnotherEarTag) {
      req.session.data.addedAnotherEarTag = null
    }

    const skinTestType = req.session.data.skinTestType || 'SICCT'
    const showSicct = skinTestType === 'SICCT' || skinTestType === 'Both'
    const showDiva  = skinTestType === 'DIVA'  || skinTestType === 'Both'
    const divaStats = divaSummary(allEntries)

    // Reactor / untested / clear breakdown for the new reporting flow.
    // For "Both", we read SICCT and DIVA reactors separately so the
    // confirmation page can list them in their own sections.
    const isBoth = skinTestType === 'Both'
    const sicctReactorIds = getReactorsForPhase(req, 'sicct')
    const divaReactorIds = getReactorsForPhase(req, 'diva')
    const combinedReactorIds = Array.from(new Set([...sicctReactorIds, ...divaReactorIds]))

    const untestedIds = Array.isArray(req.session.data.skinTestUntested)
      ? req.session.data.skinTestUntested
      : []
    const reactorSet = new Set(combinedReactorIds)
    const untestedSet = new Set(untestedIds)
    const reactorEntries = allEntries.filter(e => reactorSet.has(e.officialId))
    const sicctReactorEntries = allEntries.filter(e => sicctReactorIds.indexOf(e.officialId) !== -1)
    const divaReactorEntries = allEntries.filter(e => divaReactorIds.indexOf(e.officialId) !== -1)
    const untestedEntries = allEntries.filter(e => untestedSet.has(e.officialId) && !reactorSet.has(e.officialId))
    const clearEntries = allEntries.filter(e => !reactorSet.has(e.officialId) && !untestedSet.has(e.officialId))
    const untestedReasons = req.session.data.skinTestUntestedReasons || {}

    res.render(`${version}/skin-test-confirmation`, {
      entries: allEntries,
      entriesSummary: summary,
      divaSummary: divaStats,
      skinTestType,
      showSicct,
      showDiva,
      day1Formatted,
      day2Formatted,
      addedAnotherEarTag,
      reactorEntries,
      sicctReactorEntries,
      divaReactorEntries,
      untestedEntries,
      clearEntries,
      untestedReasons,
      addedEntries,
      reactorCount: reactorEntries.length,
      sicctReactorCount: sicctReactorEntries.length,
      divaReactorCount: divaReactorEntries.length,
      untestedCount: untestedEntries.length,
      clearCount: clearEntries.length,
      addedCount: addedEntries.length,
      isBothJourney: isBoth
    })
  })

  router.post(`/${version}/skin-test-confirmation`, function (req, res) {
    // Confirmation page is review-only now. Onward action lives on
    // a dedicated yes/no question page.
    res.redirect(`/${version}/skin-test-add-cattle-question`)
  })

  // --- "Are there more cattle to add?" yes/no -------------------------
  router.get(`/${version}/skin-test-add-cattle-question`, function (req, res) {
    res.render(`${version}/skin-test-add-cattle-question`)
  })

  router.post(`/${version}/skin-test-add-cattle-question`, function (req, res) {
    const addMoreCattle = req.body.addMoreCattle
    req.session.data.addMoreCattle = addMoreCattle

    if (addMoreCattle !== 'yes' && addMoreCattle !== 'no') {
      return res.render(`${version}/skin-test-add-cattle-question`, {
        errors: { addMoreCattle: { text: 'Select yes if there are more cattle to add, or no to submit the report' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Select yes if there are more cattle to add, or no to submit the report', href: '#addMoreCattle' }]
        }
      })
    }

    if (addMoreCattle === 'yes') {
      return res.redirect(`/${version}/skin-test-add-another`)
    }

    // Submit the report
    req.session.data.skinTestInProgress = false
    res.redirect(`/${version}/skin-test-submitted`)
  })

  // Add another animal --------------------------------------------------------

  router.get(`/${version}/skin-test-add-another`, function (req, res) {
    res.render(`${version}/skin-test-add-another`, { formValues: {} })
  })

  router.post(`/${version}/skin-test-add-another`, function (req, res) {
    const earTag = (req.body.earTag || '').trim()
    const breed = (req.body.breed || '').trim()
    const sex = (req.body.addedSex || '').trim()
    const dobDay = (req.body['addedDob-day'] || '').trim()
    const dobMonth = (req.body['addedDob-month'] || '').trim()
    const dobYear = (req.body['addedDob-year'] || '').trim()
    const dob = (dobDay && dobMonth && dobYear) ? `${dobDay}/${dobMonth}/${dobYear}` : ''

    const formValues = {
      earTag,
      breed,
      addedSex: sex,
      addedDobDay: dobDay,
      addedDobMonth: dobMonth,
      addedDobYear: dobYear,
      remarks: (req.body.remarks || '').trim()
    }

    if (!earTag) {
      return res.render(`${version}/skin-test-add-another`, {
        formValues,
        errors: { earTag: { text: 'Enter the ear tag number' } },
        errorSummary: {
          titleText: 'There is a problem',
          errorList: [{ text: 'Enter the ear tag number', href: '#earTag' }]
        }
      })
    }

    const added = Array.isArray(req.session.data.skinTestAddedEntries)
      ? [...req.session.data.skinTestAddedEntries]
      : []

    added.push({
      officialId: earTag,
      earTag,
      breed,
      sex,
      dob,
      // The page no longer captures measurements – the added animal
      // is just a record of "this animal exists on the farm and
      // wasn't on the original list" with the basic identifiers and
      // any free-text remarks the vet wants to leave.
      status: 'done',
      remarks: formValues.remarks
    })

    req.session.data.skinTestAddedEntries = added
    req.session.data.addedAnotherEarTag = earTag
    res.redirect(`/${version}/skin-test-confirmation`)
  })

  // Final submission ----------------------------------------------------------

  router.get(`/${version}/skin-test-submitted`, function (req, res) {
    const entries = getEntries(req)
    const addedEntries = getAddedEntries(req)
    const allEntries = entries.concat(addedEntries)
    const summary = entrySummary(allEntries)

    const day1Formatted = formatDateParts(
      req.session.data.skinTestDay1Day,
      req.session.data.skinTestDay1Month,
      req.session.data.skinTestDay1Year
    )
    const day2Formatted = formatDateParts(
      req.session.data.skinTestDay2Day,
      req.session.data.skinTestDay2Month,
      req.session.data.skinTestDay2Year
    )

    // Mirror the breakdown the confirmation page shows so the vet
    // sees the same summary they signed off on.
    const reactorIds = Array.isArray(req.session.data.skinTestReactors)
      ? req.session.data.skinTestReactors
      : []
    const untestedIds = Array.isArray(req.session.data.skinTestUntested)
      ? req.session.data.skinTestUntested
      : []
    const reactorSet = new Set(reactorIds)
    const untestedSet = new Set(untestedIds)
    const reactorEntries = allEntries.filter(e => reactorSet.has(e.officialId))
    const untestedEntries = allEntries.filter(e => untestedSet.has(e.officialId) && !reactorSet.has(e.officialId))
    const clearCount = allEntries.length - reactorEntries.length - untestedEntries.length
    const untestedReasons = req.session.data.skinTestUntestedReasons || {}

    // Once the user has seen the final confirmation, the report is no longer in progress
    req.session.data.skinTestInProgress = false

    res.render(`${version}/skin-test-submitted`, {
      entriesSummary: summary,
      day1Formatted,
      day2Formatted,
      reactorEntries,
      untestedEntries,
      addedEntries,
      reactorCount: reactorEntries.length,
      untestedCount: untestedEntries.length,
      addedCount: addedEntries.length,
      clearCount,
      untestedReasons
    })
  })

  // Remove an animal that was previously added on /skin-test-add-another.
  // Used by the "Remove" link next to each added animal on the
  // confirmation page so the vet can correct mistakes before submitting.
  router.post(`/${version}/skin-test-add-another/remove`, function (req, res) {
    const earTag = (req.body.earTag || '').trim()
    const added = Array.isArray(req.session.data.skinTestAddedEntries)
      ? req.session.data.skinTestAddedEntries
      : []
    req.session.data.skinTestAddedEntries = added.filter(function (e) {
      return e.officialId !== earTag
    })
    res.redirect(`/${version}/skin-test-confirmation`)
  })
}

registerSkinTestRoutes('v1-1')

module.exports = router
