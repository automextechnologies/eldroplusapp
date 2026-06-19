export function calcBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function getBMICategory(bmi) {
  if (bmi === null) return null;
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500', bg: 'bg-blue-50' };
  if (bmi < 25) return { label: 'Normal', color: 'text-green-600', bg: 'bg-green-50' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-600', bg: 'bg-yellow-50' };
  return { label: 'Obese', color: 'text-red-600', bg: 'bg-red-50' };
}

export function feetInchesToCm(feet, inches = 0) {
  return Math.round((feet * 30.48) + (inches * 2.54));
}

export function lbsToKg(lbs) {
  return Math.round(lbs * 0.453592 * 10) / 10;
}
