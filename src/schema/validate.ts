import { isMinimalPartRecipe } from '../types/part'

// Lightweight runtime validation to keep client bundle small and avoid
// bundling AJV in the browser. Ensures basic shape only.
export function validatePartRecipe(obj: any): { valid: boolean; errors?: any } {
  const valid = isMinimalPartRecipe(obj)
  return { valid, errors: valid ? undefined : 'Invalid PartRecipe shape' }
}

export default validatePartRecipe
