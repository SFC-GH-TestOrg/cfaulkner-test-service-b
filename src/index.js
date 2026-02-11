// Service B - uses shared-lib
import { formatDate, VERSION } from '@sfc-gh-testorg/cfaulkner-test-shared-lib';

export function getStatus() {
  return {
    service: 'service-b',
    sharedLibVersion: VERSION,
    checkedAt: formatDate(new Date())
  };
}
