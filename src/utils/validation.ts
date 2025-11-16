import validateNpmPackageName from 'validate-npm-package-name';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateProjectName(name: string): ValidationResult {
  const result = validateNpmPackageName(name);
  
  if (!result.validForNewPackages) {
    const errors: string[] = [];
    
    if (result.errors) {
      errors.push(...result.errors);
    }
    
    if (result.warnings) {
      errors.push(...result.warnings);
    }
    
    return {
      valid: false,
      errors
    };
  }
  
  // Additional custom validations
  if (name.length > 214) {
    return {
      valid: false,
      errors: ['Project name must be 214 characters or less']
    };
  }
  
  if (!/^[a-z0-9-._]+$/.test(name)) {
    return {
      valid: false,
      errors: ['Project name can only contain lowercase letters, numbers, hyphens, dots, and underscores']
    };
  }
  
  return {
    valid: true,
    errors: []
  };
}
