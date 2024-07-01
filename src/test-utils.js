function __getUserByEmail(email) {
    if (email === 'test1') {
        return JSON.stringify({
            row: 2,
            data: [
                'test1',
                'Test Name',
                'English',
                'Morning',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
            ],
        });
    } else if (email === 'test2') {
        return JSON.stringify({
            row: 3,
            data: [
                'test2',
                'Very Very Long Test Name',
                'Hindi',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
            ],
        });
    }
    if (email === 'test3') {
        throw new Error('test error');
    }
    return JSON.stringify({ error: 'USER_NOT_FOUND' });
}

function __setUserBatch(row, batch) {
    if (batch !== 'Morning' && batch !== 'Evening') {
        return JSON.stringify({ error: 'BATCH_NOT_FOUND' });
    } else if (row === -1) {
        throw new Error('Exception: The starting row of the range is too small.');
    }

    return JSON.stringify({});
}

function __getSessions() {
    return JSON.stringify({
        sessions: [
            ['Language', 'Date', 'Day of Week', 'Step', 'Batch', 'Time'],
            [
                'English',
                '2024-07-06T18:30:00.000Z',
                'Sunday',
                'Orientation',
                'Morning',
                '1899-12-30T00:38:50.000Z',
            ],
            [
                'English',
                '2024-07-06T18:30:00.000Z',
                'Sunday',
                'Orientation',
                'Evening',
                '1899-12-30T12:38:50.000Z',
            ],
            [
                'English',
                '2024-07-07T18:30:00.000Z',
                'Monday',
                'Step 1',
                'Morning',
                '1899-12-30T00:38:50.000Z',
            ],
            [
                'English',
                '2024-07-07T18:30:00.000Z',
                'Monday',
                'Step 1',
                'Evening',
                '1899-12-30T12:38:50.000Z',
            ],
            [
                'English',
                '2024-07-08T18:30:00.000Z',
                'Tuesday',
                'Step 2',
                'Morning',
                '1899-12-30T00:38:50.000Z',
            ],
            [
                'English',
                '2024-07-08T18:30:00.000Z',
                'Tuesday',
                'Step 2',
                'Evening',
                '1899-12-30T12:38:50.000Z',
            ],
            [
                'English',
                '2024-07-09T18:30:00.000Z',
                'Wednesday',
                'Step 3',
                'Morning',
                '1899-12-30T00:38:50.000Z',
            ],
            [
                'Hindi',
                '2024-07-06T18:30:00.000Z',
                'Sunday',
                'Orientation',
                'Morning',
                '1899-12-30T00:38:50.000Z',
            ],
            [
                'Hindi',
                '2024-07-06T18:30:00.000Z',
                'Sunday',
                'Orientation',
                'Evening',
                '1899-12-30T12:38:50.000Z',
            ],
            [
                'Hindi',
                '2024-07-07T18:30:00.000Z',
                'Monday',
                'Step 1',
                'Morning',
                '1899-12-30T00:38:50.000Z',
            ],
            [
                'Hindi',
                '2024-07-07T18:30:00.000Z',
                'Monday',
                'Step 1',
                'Evening',
                '1899-12-30T12:38:50.000Z',
            ],
            [
                'Hindi',
                '2024-07-08T18:30:00.000Z',
                'Tuesday',
                'Step 2',
                'Morning',
                '1899-12-30T00:38:50.000Z',
            ],
            [
                'Hindi',
                '2024-07-08T18:30:00.000Z',
                'Tuesday',
                'Step 2',
                'Evening',
                '1899-12-30T12:38:50.000Z',
            ],
        ],
    });
}

const google = {};
google.script = {};
google.script.run = {};
google.script.run.withFailureHandler = (errorF) => ({
    withSuccessHandler: (f) => ({
        getUserByEmail: (email) => {
            let res = null;
            try {
                res = __getUserByEmail(email);
            } catch (e) {
                errorF(e);
                return null;
            }
            f(res);
        },
        setUserBatch: (row, batch) => {
            let res = null;
            try {
                res = __setUserBatch(row, batch);
            } catch (e) {
                errorF(e);
                return null;
            }
            f(res);
        },
        getSessions: () => {
            let res = null;
            try {
                res = __getSessions();
            } catch (e) {
                errorF(e);
                return null;
            }
            f(res);
        },
    }),
});
