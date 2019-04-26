
const SubjectName = {
    MAX: 32,
    MIN: 1,
    IsValidName: function(subjectName) {
        if(!subjectName || subjectName.length > this.MAX || subjectName.length <= this.MIN)
            return false;
        return true;
    }
};

module.exports = {
    SubjectName
};

