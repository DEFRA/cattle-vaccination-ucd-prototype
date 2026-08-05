// =============================================================
// SICCT test interpretation
// =============================================================
//
// Implements the official APHA TB64 comparative-test interpretation
// rules for Great Britain. Derived from the APHA "TB64A(W) TB test
// interpretation" form (Rev. 08/18) and cross-checked against APHA /
// TB Hub guidance.
//
// Notation: A = avian skin-thickness increase (mm),
//           B = bovine skin-thickness increase (mm),
//           D = B - A.
//
// 1. REACTION POSITIVE / NEGATIVE (the gate before any comparison)
//    A reaction at a site is POSITIVE (+) if the increase is MORE than
//    2 mm, OR any oedema is present (SO) irrespective of size.
//    Otherwise it is NEGATIVE (-): increase of 2 mm or less AND no
//    oedema ("C" = circumscribed / no oedema).
//    D alone therefore never determines the result - a reaction must
//    first be classified +/-.
//
// 2. STANDARD interpretation (England, Scotland and Wales)
//    PASS      negative bovine (any avian); OR both positive with B <= A.
//    IR        positive bovine 1-4 mm greater than a positive avian; OR
//              positive bovine with a negative avian, difference <= 4 mm.
//    REACTOR   positive bovine more than 4 mm greater than a negative or
//              positive avian.
//
// 3. SEVERE interpretation (England and Scotland - the default here)
//    Lowers the reactor cut-off so standard IRs that cross it become
//    reactors; clear (PASS) animals stay clear.
//    REACTOR   positive bovine with a negative avian; OR both positive
//              with D > 2.
//    IR        both positive with 1 <= D <= 2.
//    PASS      negative bovine; OR both positive with B <= A.
//
//    REQUIRES CONFIRMATION: the fate of the both-positive 1-2 mm band
//    under England/Scotland severe is inferred here as "remains IR"
//    (severe only promotes IRs to reactors, it does not create new IRs
//    from clears). Confirm against the England/Scotland TB64 diagram.
//
//    Wales severe differs - it also turns some standard-PASS animals
//    (both positive, -2 <= D <= 0) into IRs. classifySevereWales()
//    implements that variant; it is not the default.
//
// =============================================================

/**
 * Stable result codes. Downstream code branches on these rather than
 * the user-facing labels, so the labels can be reworded freely.
 */
const RESULT_CODES = {
  PASS: 'PASS',
  INCONCLUSIVE: 'INCONCLUSIVE',
  REACTOR: 'REACTOR'
}

/** Short, user-facing labels for each result code. */
const RESULT_LABELS = {
  PASS: 'Pass',
  INCONCLUSIVE: 'Inconclusive reactor',
  REACTOR: 'Reactor'
}

/** Sentence shown to the vet under the result. Placeholder copy. */
const NEXT_ACTIONS = {
  PASS: 'No further action – the animal is retained.',
  INCONCLUSIVE: 'Isolate the animal and retest after 60 days.',
  REACTOR: 'Remove the animal from the herd as a TB reactor.'
}

/**
 * Reaction positivity gate. A site's reaction is positive if the
 * increase is more than 2 mm, or any oedema (SO) is present.
 *
 * @param {number} increase – mm increase between Day 1 and Day 2.
 * @param {'C'|'SO'} oedema – 'SO' if oedema present, else 'C'.
 * @returns {boolean}
 */
function isReactionPositive(increase, oedema) {
  const mm = Number(increase)
  const hasOedema = String(oedema || 'C').toUpperCase() === 'SO'
  return hasOedema || (!isNaN(mm) && mm > 2)
}

/**
 * STANDARD interpretation (GB-wide). Returns a RESULT_CODES value.
 */
function classifyStandard(bovineIncrease, avianIncrease, bovinePositive, avianPositive) {
  const d = bovineIncrease - avianIncrease
  if (!bovinePositive) return RESULT_CODES.PASS
  // Positive bovine equal to or less than a positive avian.
  if (avianPositive && d <= 0) return RESULT_CODES.PASS
  // Positive bovine more than 4 mm greater than avian (+ or -).
  if (d > 4) return RESULT_CODES.REACTOR
  // Positive bovine 1-4 mm greater than a positive avian, or positive
  // bovine with a negative avian and difference <= 4 mm.
  return RESULT_CODES.INCONCLUSIVE
}

/**
 * SEVERE interpretation – England and Scotland.
 */
function classifySevereEnglandScotland(bovineIncrease, avianIncrease, bovinePositive, avianPositive) {
  const d = bovineIncrease - avianIncrease
  if (!bovinePositive) return RESULT_CODES.PASS
  // Clear at standard stays clear (both positive, bovine not greater).
  if (avianPositive && d <= 0) return RESULT_CODES.PASS
  // Positive bovine with a negative avian is a severe reactor at any size.
  if (!avianPositive) return RESULT_CODES.REACTOR
  // Both positive: reactor once bovine is more than 2 mm greater.
  if (d > 2) return RESULT_CODES.REACTOR
  // Both positive, 1-2 mm greater – remains inconclusive. (See header note.)
  return RESULT_CODES.INCONCLUSIVE
}

/**
 * SEVERE interpretation – Wales variant (not the default). Some
 * standard-PASS animals (both positive, -2 <= D <= 0) become IRs.
 */
function classifySevereWales(bovineIncrease, avianIncrease, bovinePositive, avianPositive) {
  const d = bovineIncrease - avianIncrease
  if (!bovinePositive) return RESULT_CODES.PASS
  // Pass only when the avian is more than 2 mm greater than the bovine.
  if (avianPositive && d < -2) return RESULT_CODES.PASS
  if (!avianPositive) return RESULT_CODES.REACTOR
  if (d > 2) return RESULT_CODES.REACTOR
  // Both positive, -2 <= D <= 2 – inconclusive (includes clear -> IR).
  return RESULT_CODES.INCONCLUSIVE
}

/**
 * Interpret a single SICCT reading.
 *
 * @param {object} inputs
 * @param {number} inputs.bovineIncrease – mm increase at the bovine site.
 * @param {number} inputs.avianIncrease – mm increase at the avian site.
 * @param {'C'|'SO'} [inputs.bovineOedema='C']
 * @param {'C'|'SO'} [inputs.avianOedema='C']
 * @param {'standard'|'severe'} [inputs.interpretationType='standard']
 * @param {'england-scotland'|'wales'} [inputs.jurisdiction='england-scotland']
 *   Only affects severe interpretation.
 *
 * @returns {{
 *   resultCode: string|null,
 *   resultLabel: string,
 *   standardResultCode: string|null,
 *   severeResultCode: string|null,
 *   severeWouldBeReactor: boolean,
 *   explanation: string,
 *   nextAction: string,
 *   inputs: object
 * }} `resultCode` is null when the inputs are incomplete.
 */
function interpretSicct(inputs) {
  const src = inputs || {}
  const bovineIncrease = Number(src.bovineIncrease)
  const avianIncrease = Number(src.avianIncrease)
  const bovineOedema = String(src.bovineOedema || 'C').toUpperCase() === 'SO' ? 'SO' : 'C'
  const avianOedema = String(src.avianOedema || 'C').toUpperCase() === 'SO' ? 'SO' : 'C'
  const interpretationType = String(src.interpretationType || 'standard').toLowerCase()
  const jurisdiction = String(src.jurisdiction || 'england-scotland').toLowerCase()

  const normalised = {
    bovineIncrease, avianIncrease,
    bovineOedema, avianOedema,
    interpretationType, jurisdiction
  }

  if (isNaN(bovineIncrease) || isNaN(avianIncrease)) {
    return {
      resultCode: null,
      resultLabel: '',
      standardResultCode: null,
      severeResultCode: null,
      severeWouldBeReactor: false,
      explanation: 'Measurements incomplete – enter both avian and bovine readings to see the result.',
      nextAction: 'Enter both avian and bovine readings to see the result.',
      inputs: normalised
    }
  }

  const bovinePositive = isReactionPositive(bovineIncrease, bovineOedema)
  const avianPositive = isReactionPositive(avianIncrease, avianOedema)
  const d = bovineIncrease - avianIncrease

  const standardResultCode = classifyStandard(bovineIncrease, avianIncrease, bovinePositive, avianPositive)
  const classifySevere = jurisdiction === 'wales' ? classifySevereWales : classifySevereEnglandScotland
  const severeResultCode = classifySevere(bovineIncrease, avianIncrease, bovinePositive, avianPositive)

  const resultCode = interpretationType === 'severe' ? severeResultCode : standardResultCode

  // The "blue area" of the TB64 chart – inconclusive at standard,
  // reactor at severe.
  const severeWouldBeReactor = standardResultCode === RESULT_CODES.INCONCLUSIVE &&
    severeResultCode === RESULT_CODES.REACTOR

  const explanationParts = [
    'Bovine ' + bovineIncrease + ' mm (' + (bovinePositive ? '+' : '−') + ') − avian ' +
      avianIncrease + ' mm (' + (avianPositive ? '+' : '−') + ') = ' + d + ' mm',
    (interpretationType === 'severe' ? 'Severe' : 'Standard') + ' interpretation'
  ]
  if (severeWouldBeReactor && interpretationType !== 'severe') {
    explanationParts.push('Inconclusive at standard, reactor at severe interpretation')
  }

  return {
    resultCode,
    resultLabel: RESULT_LABELS[resultCode] || '',
    standardResultCode,
    severeResultCode,
    severeWouldBeReactor,
    explanation: explanationParts.join('. '),
    nextAction: NEXT_ACTIONS[resultCode] || '',
    inputs: normalised
  }
}

/**
 * Map a RESULT_CODES value back to the legacy
 * 'negative' / 'inconclusive' / 'positive' string the rest of the
 * prototype uses for overallResult.
 */
function toLegacyOverallResult(resultCode) {
  switch (resultCode) {
    case RESULT_CODES.PASS:         return 'negative'
    case RESULT_CODES.INCONCLUSIVE: return 'inconclusive'
    case RESULT_CODES.REACTOR:      return 'positive'
    default:                        return ''
  }
}

module.exports = {
  interpretSicct,
  toLegacyOverallResult,
  isReactionPositive,
  classifyStandard,
  classifySevereEnglandScotland,
  classifySevereWales,
  RESULT_CODES,
  RESULT_LABELS,
  NEXT_ACTIONS
}
