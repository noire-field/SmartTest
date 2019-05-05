const config = require('./../../config');

module.exports.registerHelpers = function(hbs) {
    hbs.registerHelper('GetLoginInfo', function(type) {
        switch(type) {
            case 0: return config.LOGIN.USERNAME.PATTERN;
            case 1: return config.LOGIN.PASSWORD.PATTERN;
            case 2: return `${config.LOGIN.USERNAME.MIN} ~ ${config.LOGIN.USERNAME.MAX}`;
            case 3: return `${config.LOGIN.PASSWORD.MIN} ~ ${config.LOGIN.PASSWORD.MAX}`;
        }
    });
    
    hbs.registerHelper('GetCurrentYear', function() {
        return new Date().getFullYear();
    });

    hbs.registerHelper('GetAvatarUrl', function(fileName) {
        if(fileName) return '/contents/avatars/'+fileName;
        else return '/img/default_avatar.png';
    });
    
    hbs.registerHelper('IfEqual', function(a, b, c) {
        if(a == b) return c;
        else return '';
    })

    hbs.registerHelper('IfEqualBlock', function(a, b, options) {
        if(a == b) return options.fn(this);
        else return options.inverse(this);
    })

    hbs.registerHelper('IfNotEmptyArray', function(value, options) {
        if(value.length > 0) return options.fn(this);
        else return options.inverse(this);
    })

    hbs.registerHelper('GetRoleTitle', function(roleType) {
        switch(roleType) {
            case 0: return 'Sinh viên';
            case 1: return 'Giảng viên';
            case 2: return 'Quản trị viên';
            default: return 'Không rõ';
        }
    })

    hbs.registerHelper('CombineName', function(firstName, lastName) {
        return `${lastName} ${firstName}`;
    });

    hbs.registerHelper('GetAdminPageUrl', function(section) {
        var dashboardUrl = '/dashboard';

        switch(section) {
            case 'Users': return dashboardUrl + '/users';
            case 'Subjects': return dashboardUrl + '/subjects';
            case 'Quests': return dashboardUrl + '/quests';
            case 'Tests': return dashboardUrl + '/tests';
            default: return dashboardUrl;
        }
    });

    hbs.registerHelper('GeneratePagination', function(urlForPageID, currentPage, totalPage) {
        var htmlBegin = `<div class="row">
                            <div class="col-md-6 offset-md-4 col-sm-6 offset-sm-3">
                                <div class="text-xs-center">
                                    <ul class="pagination mt-3 ">`;
        var htmlMiddle = '';

        currentPage = Number(currentPage);
        totalPage = Math.max(Number(totalPage), 1);

        if(currentPage == 1) htmlMiddle += `<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">First</a></li>`;
        else htmlMiddle += `<li class="page-item"><a class="page-link" href="${urlForPageID}1" tabindex="-1">First</a></li>`;
        if(currentPage <= 1) htmlMiddle += `<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">Previous</a></li>`;
        else htmlMiddle += `<li class="page-item"><a class="page-link" href="${urlForPageID}${currentPage-1}" tabindex="-1">Previous</a></li>`;

        if(totalPage <= 5)
        {
            for(let i = 1; i <= totalPage; i++) htmlMiddle += `<li class="page-item${i ==  currentPage ? ' active' : ''}"><a class="page-link" href="${urlForPageID}${i}">${i}</a></li>`;
        } else {
            if(currentPage <= 3) for(let i = 1; i <= 5; i++) htmlMiddle += `<li class="page-item${i ==  currentPage ? ' active' : ''}"><a class="page-link" href="${urlForPageID}${i}">${i}</a></li>`;
            else if(totalPage-currentPage < 3) for(let i = totalPage-4; i <= totalPage; i++) htmlMiddle += `<li class="page-item${i ==  currentPage ? ' active' : ''}"><a class="page-link" href="${urlForPageID}${i}">${i}</a></li>`;
            else {
                for(let i = currentPage-2; i < currentPage; i++) htmlMiddle += `<li class="page-item"><a class="page-link" href="${urlForPageID}${i}">${i}</a></li>`;
                htmlMiddle += `<li class="page-item active"><a class="page-link" href="${urlForPageID}${currentPage}">${currentPage$}</a></li>`;
                for(let i = currentPage+1; i < currentPage+3; i++) htmlMiddle += `<li class="page-item"><a class="page-link" href="${urlForPageID}${i}">${i}</a></li>`;
            }
        }

        if(currentPage >= totalPage) htmlMiddle += `<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">Next</a></li>`;
        else htmlMiddle += `<li class="page-item"><a class="page-link" href="${urlForPageID}${currentPage+1}" tabindex="-1">Next</a></li>`;
        if(currentPage == totalPage) htmlMiddle += `<li class="page-item disabled"><a class="page-link" href="#" tabindex="-1">Last</a></li>`;
        else htmlMiddle += `<li class="page-item"><a class="page-link" href="${urlForPageID}${totalPage}" tabindex="-1">Last</a></li>`;

        var htmlEnd = `</ul>
                        </div>
                    </div>
                </div>`;

        return htmlBegin + htmlMiddle + htmlEnd;
    });

    hbs.registerHelper('GetTestStatusText', function(statusCode) {
        switch(statusCode) {
            case 0: return 'Chưa mở';
            case 1: return 'Cho phép tham dự';
            case 2: return 'Đang kiểm tra';
            case 3: return 'Kết thúc';
            default: return 'Không rõ';
        }
    });

    hbs.registerHelper('GetTestRowColor', function(statusCode) {
        switch(statusCode) {
            case 0: return 'table-info';
            case 1: return 'table-success';
            case 2: return 'table-warning';
            case 3: return '';
            default: return 'table-warning';
        }
    });
}