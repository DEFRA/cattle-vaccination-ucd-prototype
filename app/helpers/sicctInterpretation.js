// =============================================================
// SICCT test interpretation (PROTOTYPE)
// =============================================================
//
// This module turns a set of raw SICCT (Single Intradermal
// Comparative Cervical Tuberculin) readings into a structured
// interpretation result. It's used by the v1-2 measurement screens
// (skin-test-diva-table.html / skin-test-diva.html) so the page
// template never has to encode TB interpretation rules itself.
//
// IMPORTANT – PROTOTYPE LOGIC ONLY
// --------------------------------
// The rules implemented here are a *deliberately simplified* model
// for the prototype. They MUST be validated against the official
// APHA TB64 / SICCT interpretation matrix before any production
// use. The real interpretation considers:
//   - palpable bovine reaction characteristics beyond C / SO
//   - oedema, exudation, necrosis, pain, increased temperature
//   - bovine-only positive when oedema or clinical signs present
//     even with a small comparative difference
//   - herd disease history (under restriction, contiguous to a
//     breakdown, gamma interferon results, etc.)
//   - age, sex and breed exemptions
//   - the difference between primary, short-interval, post-
//     breakdown and pre-movement tests
// None of those nuances are encoded in this helper. The threshold
// model below is purely a "demo-grade" approximation that matches
// the prototype's user research goals (showing the vet a probable
// outcome the moment they enter the four readings).
//
// =============================================================

/**
 * Stable result codes. Downstream code should branch on these
 * (rather than the user-facing labels) so the labels can be
 * reworded without breaking logic.
 */
const RESULT_CODES = {
  PASS: 'PASS',
  INCONCLUSIVE: 'INCONCLUSIVE',
  SEVERE_REACTOR: 'SEVERE_REACTOR',
  REACTOR: 'REACTOR'
}

/**
 * Short, user-facing labels for each result code. Kept here so
 * every screen displays the same wording for the same outcome.
 */
const RESULT_LABELS = {
  PASS: 'Pass',
  INCONCLUSIVE: 'Inconclusive',
  SEVERE_REACTOR: 'Severe reactor',
  REACTOR: 'Reactor'
}

/**
 * Sentence the vet sees under the result on screen. These are
 * placeholder strings for the prototype and should be replaced
 * with policy-approved copy before production.
 */
const NEXT_ACTIONS = {
  PASS: 'No further action – the animal is retained.',
  INCONCLUSIVE: 'Retest the animal at the next short-interval test.',
  SEVERE_REACTOR: 'Inconclusive at standard interpretation; would be a reactor at severe interpretation. Confirm which interpretation applies.',
  REACTOR: 'Remove the animal from the herd as a TB reactor.'
}

/**
 * Lookup table for the base threshold model. Each row says:
 * "if (bovineIncrease − avianIncrease) sits between `minDiff` and
 * `maxDiff` inclusive, the result code is X."
 *
 * Kept as data (not nested if-statements) so the thresholds can be
 * swapped out – e.g. replaced with the real TB64 matrix – without
 * having to rewrite the function. The interpretation type (standard
 * vs. severe) applies a second pass after this lookup.
 */
const BASE_THRESHOLDS = [
  { minDiff: -Infinity, maxDiff: 0,        resultCode: RESULT_CODES.PASS },
  { minDiff: 1,         maxDiff: 1,        resultCode: RESULT_CODES.INCONCLUSIVE },
  // diff = 2 is the "hybrid" band: inconclusive under standard
  // interpretation, reactor under severe.
  { minDiff: 2,         maxDiff: 2,        resultCode: RESULT_CODES.SEVERE_REACTOR },
  { minDiff: 3,         maxDiff: Infinity, resultCode: RESULT_CODES.REACTOR }
]

/**
 * Severity ladder – ordered from least to most severe. Used by the
 * oedema / reaction nudge to bump a result up one rung.
 */
const SEVERITY_LADDER = [
  RESULT_CODES.PASS,
  RESULT_CODES.INCONCLUSIVE,
  RESULT_CODES.SEVERE_REACTOR,
  RESULT_CODES.REACTOR
]

function bumpSeverity(code) {
  const idx = SEVERITY_LADDER.indexOf(code)
  if (idx === -1 || idx === SEVERITY_LADDER.length - 1) return code
  return SEVERITY_LADDER[idx + 1]
}

function lookupBaseResult(diff) {
  const match = BASE_THRESHOLDS.find(function (row) {
    return diff >= row.minDiff && diff <= row.maxDiff
  })
  return match ? match.resultCode : null
}

/**
 * Interpret a single SICCT reading.
 *
 * @param {object} inputs
 * @param {number} inputs.bovineIncrease – millimetre increase
 *   between Day 1 and Day 2 at the bovine site (0–10).
 * @param {number} inputs.avianIncrease – same for the avian site.
 * @param {'C'|'SO'} [inputs.bovineOedema='C'] – clinical (C) or
 *   skin oedema (SO) at the bovine site.
 * @param {'+'|'-'} [inputs.bovineReaction='-'] – positive (+) or
 *   negative (-) palpable bovine reaction.
 * @param {'C'|'SO'} [inputs.avianOedema='C'] – avian-site oedema.
 * @param {'+'|'-'} [inputs.avianReaction='-'] – avian-site
 *   palpable reaction.
 * @param {'standard'|'severe'} [inputs.interpretationType='standard']
 *   Which APHA interpretation rule set to apply.
 *
 * @returns {{
 *   resultCode: string|null,
 *   resultLabel: string,
 *   explanation: string,
 *   nextAction: string,
 *   inputs: object
 * }} Structured result. `resultCode` is null when the inputs are
 * incomplete (missing bovine or avian measurements).
 */
function interpretSicct(inputs) {
  const src = inputs || {}
  const bovineIncrease = Number(src.bovineIncrease)
  const avianIncrease = Number(src.avianIncrease)
  const bovineOedema = String(src.bovineOedema || 'C').toUpperCase()
  const bovineReaction = String(src.bovineReaction || '-')
  const avianOedema = String(src.avianOedema || 'C').toUpperCase()
  const avianReaction = String(src.avianReaction || '-')
  const interpretationType = String(src.interpretationType || 'standard').toLowerCase()

  const normalised = {
    bovineIncrease, avianIncrease,
    bovineOedema, bovineReaction,
    avianOedema, avianReaction,
    interpretationType
  }

  if (isNaN(bovineIncrease) || isNaN(avianIncrease)) {
    return {
      resultCode: null,
      resultLabel: '',
      explanation: 'Measurements incomplete – enter both avian and bovine readings to see the result.',
      nextAction: 'Enter both avian and bovine readings to see the result.',
      inputs: normalised
    }
  }

  const diff = bovineIncrease - avianIncrease
  const severeMode = interpretationType === 'severe'

  // 1. Look up the base result from the threshold matrix.
  let resultCode = lookupBaseResult(diff) || RESULT_CODES.PASS

  // 2. Severe interpretation collapses the SEVERE_REACTOR hybrid
  //    band into a full REACTOR call.
  if (severeMode && resultCode === RESULT_CODES.SEVERE_REACTOR) {
    resultCode = RESULT_CODES.REACTOR
  }

  // 3. Severity nudge: bovine-side oedema or a palpable + reaction
  //    bumps the result up one rung on the severity ladder. This is
  //    a coarse approximation of the real-world rule that bovine
  //    oedema can convert an otherwise inconclusive reading into a
  //    reactor. PROTOTYPE rule – not validated.
  const bovineHasSevereSign = bovineOedema === 'SO' || bovineReaction === '+'
  if (bovineHasSevereSign) {
    resultCode = bumpSeverity(resultCode)
    // Severe interpretation continues to collapse the hybrid band
    // even after the bump.
    if (severeMode && resultCode === RESULT_CODES.SEVERE_REACTOR) {
      resultCode = RESULT_CODES.REACTOR
    }
  }

  const explanationParts = [
    'Bovine increase ' + bovineIncrease + ' mm − avian increase ' + avianIncrease + ' mm = ' + diff + ' mm',
    (severeMode ? 'Severe' : 'Standard') + ' interpretation'
  ]
  if (bovineHasSevereSign) {
    explanationParts.push(
      'Bovine ' + (bovineOedema === 'SO' ? 'oedema' : 'reaction +') + ' present – severity raised one level'
    )
  }

  return {
    resultCode,
    resultLabel: RESULT_LABELS[resultCode] || '',
    explanation: explanationParts.join('. '),
    nextAction: NEXT_ACTIONS[resultCode] || '',
    inputs: normalised
  }
}

/**
 * Map the structured `resultCode` back to the legacy
 * 'negative' / 'inconclusive' / 'positive' string the rest of the
 * prototype already uses for overallResult. Kept here so callers
 * don't have to think about the mapping.
 */
function toLegacyOverallResult(resultCode) {
  switch (resultCode) {
    case RESULT_CODES.PASS:           return 'negative'
    case RESULT_CODES.INCONCLUSIVE:   return 'inconclusive'
    case RESULT_CODES.SEVERE_REACTOR: return 'inconclusive'
    case RESULT_CODES.REACTOR:        return 'positive'
    default:                          return ''
  }
}

module.exports = {
  interpretSicct,
  toLegacyOverallResult,
  RESULT_CODES,
  RESULT_LABELS,
  NEXT_ACTIONS,
  BASE_THRESHOLDS
}
