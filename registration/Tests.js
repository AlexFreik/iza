function Tests() {
    Import.UnitTesting.init();

    // ===== Utils =====
    (() =>
        describe('getMinMax', () => {
            it('empty array', () => {
                assert.equals({
                    expected: null,
                    actual: getMinMax([]),
                });
            });
            it('one element', () => {
                assert.objectEquals({
                    expected: { min: 5, max: 5 },
                    actual: getMinMax([5]),
                });
            });
            it('many elements', () => {
                assert.objectEquals({
                    expected: { min: 1, max: 5 },
                    actual: getMinMax([5, 1]),
                });
                assert.objectEquals({
                    expected: { min: 1, max: 5 },
                    actual: getMinMax([1, 5]),
                });
                assert.objectEquals({
                    expected: { min: -5, max: 33 },
                    actual: getMinMax([1, 5, 33, 0, -5]),
                });
            });
        }))();

    // ===== Sheet =====
    (() =>
        describe('User', () => {
            const u1 = new User(
                ['example@mail.com', 'John Doe', 'English', '', '', '', 'Course Started'],
                1,
            );
            const u2 = new User(
                ['example2@mail.com', 'John', 'English', '', '', '', 'Course Started'],
                2,
            );
            const u3 = new User(
                ['example3@mail.com', '', 'English', '', '', '', 'Course Started'],
                3,
            );
            it('first and last name', function () {
                assert.throwsError(() => u3.firstName);

                assert.equals({
                    expected: 'John',
                    actual: u1.firstName,
                });
                assert.equals({
                    expected: 'Doe',
                    actual: u1.lastName,
                });

                assert.equals({
                    expected: 'John',
                    actual: u2.firstName,
                });
                assert.equals({
                    expected: '',
                    actual: u2.lastName,
                });
            });
        }))();

    (() =>
        describe('getUsers', () => {
            it('get zero users', () => {
                assert.equals({
                    expected: 0,
                    actual: getUsers(2, 0).length,
                });
            });

            let ret = getUsers(2, 2);
            it('no errors', () => {
                assert.equals({
                    expected: 2,
                    actual: ret.length,
                });
            });
        }))();

    (() =>
        describe('updateSheetZoomLinks', () => {
            zoomMeetings.test = {
                batch1: 'testId1',
                batch2: 'testId2',
            };

            const users = getUsers(2, 3);
            const oldLinks = [users[0].links, users[1].links, users[2].links];
            users[0].links = ['', ''];
            users[1].links = ['', ''];
            users[2].links = ['', ''];
            updateSheetZoomLinks(users);
            let newUsers = getUsers(2, 3);

            it('empty link', () => {
                assert.arrayEquals({
                    expected: ['', ''],
                    actual: newUsers[0].links,
                });
                assert.arrayEquals({
                    expected: ['', ''],
                    actual: newUsers[1].links,
                });
                assert.arrayEquals({
                    expected: ['', ''],
                    actual: newUsers[2].links,
                });
            });

            users[0].links = ['https://test1.com', 'https://test2.com'];
            users[1].links = oldLinks[1];
            users[2].links = ['https://test5.com', 'https://test6.com'];
            updateSheetZoomLinks(users);
            newUsers = getUsers(2, 3);
            it('it works', () => {
                assert.arrayEquals({
                    expected: ['https://test1.com', 'https://test2.com'],
                    actual: newUsers[0].links,
                });
                assert.arrayEquals({
                    expected: oldLinks[1],
                    actual: newUsers[1].links,
                });
                assert.arrayEquals({
                    expected: ['https://test5.com', 'https://test6.com'],
                    actual: newUsers[2].links,
                });
            });

            users[0].links = oldLinks[0];
            users[2].links = oldLinks[2];
            updateSheetZoomLinks(users);
            newUsers = getUsers(2, 3);
            it('restore links to initial values', () => {
                assert.arrayEquals({
                    expected: oldLinks[0],
                    actual: newUsers[0].links,
                });
                assert.arrayEquals({
                    expected: oldLinks[1],
                    actual: newUsers[1].links,
                });
                assert.arrayEquals({
                    expected: oldLinks[2],
                    actual: newUsers[2].links,
                });
            });
        }))();

    // ===== Zoom Auth Token =====
    () =>
        describe('getToken', () => {
            const props = PropertiesService.getScriptProperties();
            props.deleteProperty('token');
            const token = getToken();

            it('Error is null', () => {
                assert.null_({ actual: token.error });
            });

            it('Token is present', () => {
                assert.equals({
                    expected: 'string',
                    actual: typeof token.token,
                });
            });

            it('Expiery date is in the future', () => {
                assert.true_({ actual: token.expiry - Date.now() > 55 * 60 * 1000 });
            });

            const token2 = getToken();
            it('Token is not regenerated every time', () => {
                assert.equals({
                    expected: token.token,
                    actual: token2.token,
                });
            });
        });
    // )();
    // ===== Zoom Meeting Registration ======
}

function printToken() {
    console.log(getToken().token);
}
