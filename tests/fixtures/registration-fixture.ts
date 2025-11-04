import {test as base} from '@playwright/test'

import {RegistrationHelper} from '../helpers/registration.helper'

export type TestFixtures = {
    registrationHelper: RegistrationHelper;
};

export const test = base.extend<TestFixtures>({
    registrationHelper: async ({page}, use) => {
        await use(new RegistrationHelper(page))
    }
})

export {expect} from '@playwright/test'