const expect = require('expect');

const { generateMessage } = require('./message');

describe('generateMessage', () => {
    it('should generate correct message object', () => {
        var from = "Saigon";
        var text = "Vietcong is coming";

        var result = generateMessage(from, text);

        expect(result).toMatchObject({from,text})
        expect(typeof result.createdAt).toBe('number');
    });
});