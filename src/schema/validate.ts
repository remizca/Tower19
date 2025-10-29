import Ajv from 'ajv'
import schema from '../../docs/schema/part-recipe.schema.json'

const ajv = new Ajv({ allErrors: true })
const validate = ajv.compile(schema as object)

export function validatePartRecipe(obj: any): { valid: boolean; errors?: any } {
  const valid = validate(obj)
  return { valid: Boolean(valid), errors: validate.errors }
}

export default validatePartRecipe
