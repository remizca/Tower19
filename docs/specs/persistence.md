# Client-Side Persistence Specification

## Storage Technologies

### IndexedDB
Primary storage mechanism for:
- Part recipes
- User bookmarks
- Timer records
- Export preferences

### Local Storage
Backup/temporary storage for:
- Current session state
- UI preferences
- Recent activity

## Data Structures

### Part Storage
```typescript
interface StoredPart {
  id: string;
  recipe: PartRecipe;
  created: number;
  lastViewed: number;
  bookmarked: boolean;
  completed: boolean;
  timeSpent: number;
}
```

### User Records
```typescript
interface UserRecord {
  partId: string;
  timeSpent: number;
  completed: boolean;
  difficulty: string;
  date: number;
}
```

### Export Settings
```typescript
interface ExportPreferences {
  format: 'PDF' | 'DXF' | 'STP';
  paperSize: string;
  units: 'mm' | 'inch';
  includeTitle: boolean;
  includeDimensions: boolean;
}
```

## Database Schema

### Stores
1. **parts**
   - Key: partId (string)
   - Value: StoredPart

2. **records**
   - Key: auto-increment
   - Value: UserRecord
   - Indexes: 
     - partId
     - difficulty
     - date

3. **preferences**
   - Key: preferenceName
   - Value: any

## Migration System

### Version History
1. v1: Initial schema
2. v2: Add bookmarks
3. v3: Add time tracking

### Migration Steps
1. Schema version detection
2. Data backup
3. Schema updates
4. Data migration
5. Verification

## Export Generation

### PDF Generation
1. SVG to PDF conversion
2. Multiple page support
3. Title block inclusion
4. Scale preservation

### DXF Export
1. Geometry conversion
2. Layer management
3. Standards compliance
4. Metadata inclusion

### STEP Export
1. 3D model conversion
2. Unit preservation
3. Feature preservation
4. Assembly structure

## Offline Support

### Service Worker
1. Static asset caching
2. API response caching
3. Offline detection
4. Sync queuing

### Data Synchronization
1. Change detection
2. Conflict resolution
3. Queue management
4. Retry logic

## Error Handling

### Storage Errors
1. Quota exceeded
2. Permission denied
3. Version mismatch
4. Corruption detection

### Recovery Procedures
1. Automatic backup
2. Data verification
3. Fallback storage
4. User notification

## Performance

### Optimization Strategies
1. Batch operations
2. Index utilization
3. Data compression
4. Cache management

### Monitoring
1. Storage usage
2. Operation timing
3. Error rates
4. Performance metrics