-- phpMyAdmin SQL Dump
-- version 4.7.4
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 21, 2019 at 08:53 AM
-- Server version: 10.1.28-MariaDB
-- PHP Version: 7.1.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `smarttest`
--

-- --------------------------------------------------------

--
-- Table structure for table `answers`
--

CREATE TABLE `answers` (
  `AnsID` int(11) NOT NULL,
  `QuestID` int(11) NOT NULL,
  `AnsType` int(11) NOT NULL DEFAULT '0',
  `AnsContent` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `ImageUrl` varchar(128) DEFAULT NULL,
  `IsCorrect` bit(1) DEFAULT b'0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `answers`
--

INSERT INTO `answers` (`AnsID`, `QuestID`, `AnsType`, `AnsContent`, `ImageUrl`, `IsCorrect`) VALUES
(20, 6, 0, '1955', NULL, b'0'),
(21, 6, 0, '1945', NULL, b'1'),
(22, 6, 0, '1911', NULL, b'0'),
(23, 6, 0, '1975', NULL, b'0'),
(24, 7, 0, '1945', NULL, b'0'),
(25, 7, 0, '1955', NULL, b'1'),
(26, 7, 0, '1942', NULL, b'0'),
(27, 7, 0, '1975', NULL, b'0'),
(28, 8, 0, '1939-1945', NULL, b'1'),
(29, 8, 0, '1914-1918', NULL, b'0'),
(30, 8, 0, '1884-1865', NULL, b'0'),
(31, 8, 0, '1954-1975', NULL, b'0'),
(32, 9, 0, '1884-1865', NULL, b'0'),
(33, 9, 0, '1939-1945', NULL, b'0'),
(34, 9, 0, '1914-1918', NULL, b'1'),
(35, 9, 0, '1954-1975', NULL, b'0'),
(36, 10, 0, 'Trần Hưng Đạo', NULL, b'0'),
(37, 10, 0, 'Nguyễn Huệ', NULL, b'0'),
(38, 10, 0, 'Quang Trung', NULL, b'0'),
(39, 10, 0, 'Ngô Quyền', NULL, b'1'),
(44, 12, 0, '1936', NULL, b'0'),
(45, 12, 0, '1954', NULL, b'1'),
(46, 12, 0, '1942', NULL, b'0'),
(47, 12, 0, '1975', NULL, b'0'),
(52, 11, 0, '1912', NULL, b'0'),
(53, 11, 0, '1905', NULL, b'0'),
(54, 11, 0, '1890', NULL, b'0'),
(55, 11, 0, '1911', NULL, b'1'),
(56, 13, 0, 'Trần Quốc Toản', NULL, b'0'),
(57, 13, 0, 'Trần Quang Khải', NULL, b'0'),
(58, 13, 0, 'Trần Quốc Tuấn', NULL, b'1'),
(59, 13, 0, 'Trần Bình Trọng', NULL, b'0'),
(60, 14, 0, 'Nguyễn Huệ', NULL, b'1'),
(61, 14, 0, 'Nguyễn Lữ', NULL, b'0'),
(62, 14, 0, 'Trần Hưng Đạo', NULL, b'0'),
(63, 14, 0, 'Nguyễn Nhạc', NULL, b'0'),
(64, 15, 0, '1941', NULL, b'1'),
(65, 15, 0, '1943', NULL, b'0'),
(66, 15, 0, '1942', NULL, b'0'),
(67, 15, 0, '1944', NULL, b'0'),
(68, 16, 0, 'Tokyo', NULL, b'0'),
(69, 16, 0, 'Osaka', NULL, b'0'),
(70, 16, 0, 'Hiroshima', NULL, b'1'),
(71, 16, 0, 'Sapporo', NULL, b'0'),
(72, 17, 0, 'Nguyễn Văn Thiệu', NULL, b'0'),
(73, 17, 0, 'Dương Văn Minh', NULL, b'0'),
(74, 17, 0, 'Trần Trọng Kim', NULL, b'0'),
(75, 17, 0, 'Ngô Đình Diệm', NULL, b'1'),
(76, 18, 0, '1972', NULL, b'1'),
(77, 18, 0, '1975', NULL, b'0'),
(78, 18, 0, '1968', NULL, b'0'),
(79, 18, 0, '1965', NULL, b'0'),
(80, 19, 0, '1778', NULL, b'0'),
(81, 19, 0, '1975', NULL, b'0'),
(82, 19, 0, '1698', NULL, b'1'),
(83, 19, 0, '1886', NULL, b'0'),
(87, 20, 0, 'Bảo Đại', NULL, b'1'),
(88, 20, 0, 'Hàm Nghi', NULL, b'0'),
(89, 20, 0, 'Nguyễn Ánh', NULL, b'0'),
(90, 21, 0, '1890', NULL, b'0'),
(91, 21, 0, '1907', NULL, b'0'),
(92, 21, 0, '1912', NULL, b'0'),
(93, 21, 0, '1911', NULL, b'1'),
(94, 22, 0, '1939', NULL, b'0'),
(95, 22, 0, '1945', NULL, b'0'),
(96, 22, 0, '1942', NULL, b'0'),
(97, 22, 0, '1954', NULL, b'1'),
(98, 23, 0, 'Thực dân Pháp', NULL, b'1'),
(99, 23, 0, 'Thực dân Tây Ban Nha', NULL, b'0'),
(100, 23, 0, 'Thực dân Anh', NULL, b'0'),
(101, 23, 0, 'Thực dân Hoa Kỳ', NULL, b'0'),
(102, 24, 0, '1914-1918', NULL, b'0'),
(103, 24, 0, '1954-1975', NULL, b'0'),
(104, 24, 0, '1939-1945', NULL, b'0'),
(105, 24, 0, '1955-1975', NULL, b'1'),
(106, 25, 0, '1944', NULL, b'0'),
(107, 25, 0, '1976', NULL, b'0'),
(108, 25, 0, '1955', NULL, b'0'),
(109, 25, 0, '1945', NULL, b'1'),
(110, 26, 0, '1968', NULL, b'0'),
(111, 26, 0, '1973', NULL, b'0'),
(112, 26, 0, '1954', NULL, b'1'),
(113, 26, 0, '1945', NULL, b'0'),
(114, 27, 0, 'Bọn Việt Quốc, Việt Cách', NULL, b'0'),
(115, 27, 0, 'Bọn Nhật đang còn tại Việt Nam', NULL, b'0'),
(116, 27, 0, 'Bọn thực dân Anh', NULL, b'1'),
(117, 27, 0, 'Bọn phản cách mạng', NULL, b'0'),
(118, 28, 0, 'Ngày 18/12/1946', NULL, b'0'),
(119, 28, 0, 'Đêm 20/12/1946', NULL, b'0'),
(120, 28, 0, 'Ngày 22/12/1946', NULL, b'0'),
(121, 28, 0, 'Đêm 19/12/1946', NULL, b'1'),
(122, 29, 0, '60 ngày đêm', NULL, b'0'),
(123, 29, 0, '66 ngày đêm', NULL, b'0'),
(124, 29, 0, '55 ngày đêm', NULL, b'0'),
(125, 29, 0, '56 ngày đêm', NULL, b'1'),
(126, 30, 0, 'Chiến thắng Tây Bắc', NULL, b'0'),
(127, 30, 0, 'Chiến thắng biên giới', NULL, b'0'),
(128, 30, 0, 'Chiến thắng Đông Xuân 1953-1954', NULL, b'0'),
(129, 30, 0, 'Chiến thắng Điện Biên Phủ', NULL, b'1'),
(130, 31, 0, '938', NULL, b'1'),
(131, 31, 0, '939', NULL, b'0'),
(132, 31, 0, '931', NULL, b'0'),
(133, 31, 0, '937', NULL, b'0'),
(134, 32, 0, 'Trần Hưng Đạo', NULL, b'0'),
(135, 32, 0, 'Nguyễn Lữ', NULL, b'0'),
(136, 32, 0, 'Quang Trung', NULL, b'1'),
(137, 32, 0, 'Nguyễn Nhạc', NULL, b'0'),
(138, 33, 0, 'Quân Anh, quân Mỹ', NULL, b'0'),
(139, 33, 0, 'Quân Anh, quân Trung Hoa Dân Quốc', NULL, b'1'),
(140, 33, 0, 'Quân Pháp, quân Anh', NULL, b'0'),
(141, 33, 0, 'Quân Pháp quân Trung Hoa Dân Quốc', NULL, b'0'),
(142, 34, 0, 'Văn hóa hiện đại theo kiểu phương Tây', NULL, b'0'),
(143, 34, 0, 'Văn hóa đậm đà bản sắc dân tộc', NULL, b'0'),
(144, 34, 0, 'Hơn 90% dân số không biết chữ', NULL, b'1'),
(145, 34, 0, 'Văn hóa mang nặng tư tưởng phản động của phát xít Nhật', NULL, b'0'),
(146, 35, 0, 'Đế quốc Anh', NULL, b'0'),
(147, 35, 0, 'Quân Trung Hoa Dân Quốc', NULL, b'0'),
(148, 35, 0, 'Phát xít Nhật', NULL, b'0'),
(149, 35, 0, 'Thực dân Pháp', NULL, b'1');

-- --------------------------------------------------------

--
-- Table structure for table `partquests`
--

CREATE TABLE `partquests` (
  `PartQuestID` int(11) NOT NULL,
  `TestPartID` int(11) NOT NULL,
  `QuestID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `partquests`
--

INSERT INTO `partquests` (`PartQuestID`, `TestPartID`, `QuestID`) VALUES
(111, 27, 21),
(112, 27, 24),
(113, 28, 31),
(114, 28, 33),
(115, 28, 35),
(116, 28, 32),
(117, 27, 23),
(118, 27, 25),
(119, 29, 27),
(120, 27, 22),
(121, 28, 34),
(122, 29, 26),
(123, 29, 29),
(124, 29, 30),
(125, 29, 28);

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE `questions` (
  `QuestID` int(11) NOT NULL,
  `SubjectID` int(11) NOT NULL,
  `QuestContent` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `ImageUrl` varchar(128) DEFAULT NULL,
  `OwnerID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `questions`
--

INSERT INTO `questions` (`QuestID`, `SubjectID`, `QuestContent`, `ImageUrl`, `OwnerID`) VALUES
(6, 6, 'CT. Hồ Chí Minh đọc tuyên ngôn độc lập năm bao nhiêu?', NULL, 1),
(7, 6, 'VNCH thành lập năm bao nhiêu?', NULL, 1),
(8, 6, 'Chiến tranh thế giới thứ hai diễn ra khi nào?', NULL, 1),
(9, 6, 'Chiến tranh thế giới thứ nhất diễn ra khi nào?', NULL, 1),
(10, 6, 'Ai đánh tan quân Nam Hán?', NULL, 1),
(11, 6, 'Hồ Chí Minh ra đi tìm đường cứu nước năm nào?', NULL, 1),
(12, 6, 'Chiến thắng Điện Biên Phủ năm bao nhiêu?', NULL, 1),
(13, 6, 'Tên khác của Trần Hưng Đạo?', NULL, 1),
(14, 6, 'Ai đánh tan 30 vạn quân Thanh?', NULL, 1),
(15, 6, 'Trận Trân Châu Cảng diễn ra năm bao nhiêu?', NULL, 1),
(16, 6, 'Thành phố nào của Nhật bị ném bom nguyên tử đầu tiên?', NULL, 1),
(17, 6, 'Tổng thống đầu tiên của nước VNCH là ai?', NULL, 1),
(18, 6, 'Trận mùa hè đỏ lửa diễn ra năm nào?', NULL, 1),
(19, 6, 'Thành Gia Định có từ năm nào?', NULL, 1),
(20, 6, 'Vị vua cuối cùng của triều Nguyễn là ai?', NULL, 1),
(21, 7, 'Chủ tịch Hồ Chí Minh ra đi tìm đường cứu nước năm nào?', NULL, 5),
(22, 7, 'Chiến thắng Điện Biên Phủ diễn ra năm nào?', NULL, 5),
(23, 7, 'Thực dân nào đô hộ nước ta từ năm 1858?', NULL, 5),
(24, 7, 'Chiến tranh Việt Nam diễn ra trong thời gian nào?', NULL, 5),
(25, 7, 'Nhà nước Việt Nam Dân chủ Cộng hòa được khai sinh năm nào?', NULL, 5),
(26, 7, 'Hiệp định Giơ-ne-vơ chia đôi đất nước được ký năm nào?', NULL, 5),
(27, 7, 'Kẻ thù nào dọn đường tiếp tay cho thực dân Pháp quay lại xâm lược nước ta?', NULL, 5),
(28, 7, 'Cuộc kháng chiến toàn quốc chống thực dân Pháp bắt đầu từ lúc nào?', NULL, 5),
(29, 7, 'Chiến dịch Điện Biên Phủ diễn ra trong bao nhiêu ngày?', NULL, 5),
(30, 7, 'Chiến thắng nào quyết định thắng lợi của Hội nghị Giơ-ne-vơ', NULL, 5),
(31, 7, 'Ngô Quyền chiến thắng Bạch Đằng năm nào?', NULL, 5),
(32, 7, 'Hoàng đế nào của nhà Tây Sơn đại phá 20 vạn quân Thanh?', NULL, 5),
(33, 7, 'Quân đội Đồng minh các nước vào nước ta sau năm 1945 là?', NULL, 5),
(34, 7, 'Tàn dư văn hóa do chế độ thực dân phong kiến để lại sau Cách mạng tháng Tám là?', NULL, 5),
(35, 7, 'Sau cách mạng tháng 8 năm 1945, chúng ta phải đối mặt với nhiều kẻ thù, trong đó nguy hiểm nhất là?', NULL, 5);

-- --------------------------------------------------------

--
-- Table structure for table `questtags`
--

CREATE TABLE `questtags` (
  `QuestID` int(11) NOT NULL,
  `Tag` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `questtags`
--

INSERT INTO `questtags` (`QuestID`, `Tag`) VALUES
(6, 'Basic'),
(6, 'History'),
(7, 'History'),
(7, 'Medium'),
(8, 'Advanced'),
(8, 'History'),
(9, 'Advanced'),
(9, 'History'),
(10, 'History'),
(10, 'Medium'),
(11, 'Basic'),
(11, 'History'),
(12, 'Basic'),
(12, 'History'),
(13, 'History'),
(13, 'Medium'),
(14, 'Basic'),
(14, 'History'),
(15, 'History'),
(15, 'Medium'),
(16, 'Basic'),
(16, 'History'),
(17, 'History'),
(17, 'Medium'),
(18, 'Advanced'),
(18, 'History'),
(19, 'Advanced'),
(19, 'History'),
(20, 'Advanced'),
(20, 'History'),
(21, 'Basic'),
(21, 'History'),
(22, 'Basic'),
(22, 'History'),
(23, 'Basic'),
(23, 'History'),
(24, 'Basic'),
(24, 'History'),
(25, 'Basic'),
(25, 'History'),
(26, 'History'),
(26, 'Medium'),
(27, 'History'),
(27, 'Medium'),
(28, 'History'),
(28, 'Medium'),
(29, 'History'),
(29, 'Medium'),
(30, 'History'),
(30, 'Medium'),
(31, 'Advanced'),
(31, 'History'),
(32, 'Advanced'),
(32, 'History'),
(33, 'Advanced'),
(33, 'History'),
(34, 'Advanced'),
(34, 'History'),
(35, 'Advanced'),
(35, 'History');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('4205ef03-6694-4b9c-bdcf-9d510e0d4551', 1554258773, '{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"}}'),
('a59abfd2-94d2-49db-875f-f15d90357ca5', 1554259792, '{\"cookie\":{\"originalMaxAge\":null,\"expires\":null,\"httpOnly\":true,\"path\":\"/\"},\"passport\":{}}');

-- --------------------------------------------------------

--
-- Table structure for table `studenttestquests`
--

CREATE TABLE `studenttestquests` (
  `StuTestQuestID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `PartQuestID` int(11) NOT NULL,
  `AnsID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `studenttestquests`
--

INSERT INTO `studenttestquests` (`StuTestQuestID`, `UserID`, `PartQuestID`, `AnsID`) VALUES
(38, 6, 118, 109),
(39, 6, 112, 105),
(40, 6, 111, 93),
(41, 6, 117, 98),
(42, 6, 120, 97);

-- --------------------------------------------------------

--
-- Table structure for table `studenttests`
--

CREATE TABLE `studenttests` (
  `StuTestID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `TestID` int(11) NOT NULL,
  `JoinedDate` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `studenttests`
--

INSERT INTO `studenttests` (`StuTestID`, `UserID`, `TestID`, `JoinedDate`) VALUES
(13, 6, 14, '2019-05-21 13:07:29');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `SubjectID` int(11) NOT NULL,
  `SubjectName` varchar(128) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `OwnerID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`SubjectID`, `SubjectName`, `OwnerID`) VALUES
(4, 'Really NIgga?', 2),
(7, 'Lịch sử Việt Nam', 5);

-- --------------------------------------------------------

--
-- Table structure for table `testparts`
--

CREATE TABLE `testparts` (
  `TestPartID` int(11) NOT NULL,
  `TestID` int(11) NOT NULL,
  `PartName` varchar(64) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `DisplayOrder` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `testparts`
--

INSERT INTO `testparts` (`TestPartID`, `TestID`, `PartName`, `DisplayOrder`) VALUES
(27, 14, 'Cơ Bản', 1),
(28, 14, 'Nâng Cao', 3),
(29, 14, 'Trung Bình', 2);

-- --------------------------------------------------------

--
-- Table structure for table `testresults`
--

CREATE TABLE `testresults` (
  `UserID` int(11) NOT NULL,
  `TestID` int(11) NOT NULL,
  `CorrectCount` int(11) NOT NULL,
  `TotalCount` int(11) NOT NULL,
  `CheckedDate` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `testresults`
--

INSERT INTO `testresults` (`UserID`, `TestID`, `CorrectCount`, `TotalCount`, `CheckedDate`) VALUES
(6, 14, 5, 15, '2019-05-21 13:10:36');

-- --------------------------------------------------------

--
-- Table structure for table `tests`
--

CREATE TABLE `tests` (
  `TestID` int(11) NOT NULL,
  `PINCode` varchar(8) NOT NULL,
  `TestName` varchar(64) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `TestTime` int(11) NOT NULL,
  `StartTime` datetime NOT NULL,
  `QuestTotal` int(11) DEFAULT NULL,
  `OpenStatus` int(11) NOT NULL DEFAULT '0',
  `OwnerID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `tests`
--

INSERT INTO `tests` (`TestID`, `PINCode`, `TestName`, `TestTime`, `StartTime`, `QuestTotal`, `OpenStatus`, `OwnerID`) VALUES
(14, '77777', 'Kiểm thử bộ đề Lịch Sử', 15, '2019-05-21 13:07:31', 15, 3, 5);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `Username` varchar(32) NOT NULL,
  `Password` varchar(128) NOT NULL,
  `Email` varchar(64) NOT NULL,
  `FirstName` varchar(64) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `LastName` varchar(64) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `RoleType` int(11) NOT NULL DEFAULT '0',
  `RegisteredDate` datetime DEFAULT NULL,
  `AvatarFile` varchar(64) DEFAULT NULL,
  `StudentID` varchar(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserID`, `Username`, `Password`, `Email`, `FirstName`, `LastName`, `RoleType`, `RegisteredDate`, `AvatarFile`, `StudentID`) VALUES
(1, 'admin', '123456789', 'admin@admin.com', 'Cường', 'Vũ Mạnh', 2, '2019-04-02 09:40:00', 'User_01.png', '115000585'),
(5, 'lecturer', '123456789', '', 'Cường', 'Vũ', 1, '2019-05-21 11:20:43', NULL, ''),
(6, 'student1', '123456789', '', 'Tùng', 'Phạm Sơn', 0, '2019-05-21 12:02:10', NULL, '115000123');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `answers`
--
ALTER TABLE `answers`
  ADD PRIMARY KEY (`AnsID`);

--
-- Indexes for table `partquests`
--
ALTER TABLE `partquests`
  ADD PRIMARY KEY (`PartQuestID`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`QuestID`);

--
-- Indexes for table `questtags`
--
ALTER TABLE `questtags`
  ADD PRIMARY KEY (`QuestID`,`Tag`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `studenttestquests`
--
ALTER TABLE `studenttestquests`
  ADD PRIMARY KEY (`StuTestQuestID`);

--
-- Indexes for table `studenttests`
--
ALTER TABLE `studenttests`
  ADD PRIMARY KEY (`StuTestID`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`SubjectID`);

--
-- Indexes for table `testparts`
--
ALTER TABLE `testparts`
  ADD PRIMARY KEY (`TestPartID`);

--
-- Indexes for table `testresults`
--
ALTER TABLE `testresults`
  ADD PRIMARY KEY (`UserID`,`TestID`);

--
-- Indexes for table `tests`
--
ALTER TABLE `tests`
  ADD PRIMARY KEY (`TestID`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `answers`
--
ALTER TABLE `answers`
  MODIFY `AnsID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=150;

--
-- AUTO_INCREMENT for table `partquests`
--
ALTER TABLE `partquests`
  MODIFY `PartQuestID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=126;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `QuestID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `studenttestquests`
--
ALTER TABLE `studenttestquests`
  MODIFY `StuTestQuestID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `studenttests`
--
ALTER TABLE `studenttests`
  MODIFY `StuTestID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `SubjectID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `testparts`
--
ALTER TABLE `testparts`
  MODIFY `TestPartID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `tests`
--
ALTER TABLE `tests`
  MODIFY `TestID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
