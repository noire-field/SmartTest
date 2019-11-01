-- phpMyAdmin SQL Dump
-- version 4.7.4
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 01, 2019 at 01:59 PM
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
  `IsCorrect` int(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `answers`
--

INSERT INTO `answers` (`AnsID`, `QuestID`, `AnsType`, `AnsContent`, `ImageUrl`, `IsCorrect`) VALUES
(24, 7, 0, '1945', NULL, 0),
(25, 7, 0, '1955', NULL, 1),
(26, 7, 0, '1942', NULL, 0),
(27, 7, 0, '1975', NULL, 0),
(28, 8, 0, '1939-1945', NULL, 1),
(29, 8, 0, '1914-1918', NULL, 0),
(30, 8, 0, '1884-1865', NULL, 0),
(31, 8, 0, '1954-1975', NULL, 0),
(32, 9, 0, '1884-1865', NULL, 0),
(33, 9, 0, '1939-1945', NULL, 0),
(34, 9, 0, '1914-1918', NULL, 1),
(35, 9, 0, '1954-1975', NULL, 0),
(36, 10, 0, 'Trần Hưng Đạo', NULL, 0),
(37, 10, 0, 'Nguyễn Huệ', NULL, 0),
(38, 10, 0, 'Quang Trung', NULL, 0),
(39, 10, 0, 'Ngô Quyền', NULL, 1),
(44, 12, 0, '1936', NULL, 0),
(45, 12, 0, '1954', NULL, 1),
(46, 12, 0, '1942', NULL, 0),
(47, 12, 0, '1975', NULL, 0),
(52, 11, 0, '1912', NULL, 0),
(53, 11, 0, '1905', NULL, 0),
(54, 11, 0, '1890', NULL, 0),
(55, 11, 0, '1911', NULL, 1),
(56, 13, 0, 'Trần Quốc Toản', NULL, 0),
(57, 13, 0, 'Trần Quang Khải', NULL, 0),
(58, 13, 0, 'Trần Quốc Tuấn', NULL, 1),
(59, 13, 0, 'Trần Bình Trọng', NULL, 0),
(60, 14, 0, 'Nguyễn Huệ', NULL, 1),
(61, 14, 0, 'Nguyễn Lữ', NULL, 0),
(62, 14, 0, 'Trần Hưng Đạo', NULL, 0),
(63, 14, 0, 'Nguyễn Nhạc', NULL, 0),
(64, 15, 0, '1941', NULL, 1),
(65, 15, 0, '1943', NULL, 0),
(66, 15, 0, '1942', NULL, 0),
(67, 15, 0, '1944', NULL, 0),
(68, 16, 0, 'Tokyo', NULL, 0),
(69, 16, 0, 'Osaka', NULL, 0),
(70, 16, 0, 'Hiroshima', NULL, 1),
(71, 16, 0, 'Sapporo', NULL, 0),
(72, 17, 0, 'Nguyễn Văn Thiệu', NULL, 0),
(73, 17, 0, 'Dương Văn Minh', NULL, 0),
(74, 17, 0, 'Trần Trọng Kim', NULL, 0),
(75, 17, 0, 'Ngô Đình Diệm', NULL, 1),
(76, 18, 0, '1972', NULL, 1),
(77, 18, 0, '1975', NULL, 0),
(78, 18, 0, '1968', NULL, 0),
(79, 18, 0, '1965', NULL, 0),
(80, 19, 0, '1778', NULL, 0),
(81, 19, 0, '1975', NULL, 0),
(82, 19, 0, '1698', NULL, 1),
(83, 19, 0, '1886', NULL, 0),
(87, 20, 0, 'Bảo Đại', NULL, 1),
(88, 20, 0, 'Hàm Nghi', NULL, 0),
(89, 20, 0, 'Nguyễn Ánh', NULL, 0),
(94, 22, 0, '1939', NULL, 0),
(95, 22, 0, '1945', NULL, 0),
(96, 22, 0, '1942', NULL, 0),
(97, 22, 0, '1954', NULL, 1),
(98, 23, 0, 'Thực dân Pháp', NULL, 1),
(99, 23, 0, 'Thực dân Tây Ban Nha', NULL, 0),
(100, 23, 0, 'Thực dân Anh', NULL, 0),
(101, 23, 0, 'Thực dân Hoa Kỳ', NULL, 0),
(102, 24, 0, '1914-1918', NULL, 0),
(103, 24, 0, '1954-1975', NULL, 0),
(104, 24, 0, '1939-1945', NULL, 0),
(105, 24, 0, '1955-1975', NULL, 1),
(106, 25, 0, '1944', NULL, 0),
(107, 25, 0, '1976', NULL, 0),
(108, 25, 0, '1955', NULL, 0),
(109, 25, 0, '1945', NULL, 1),
(110, 26, 0, '1968', NULL, 0),
(111, 26, 0, '1973', NULL, 0),
(112, 26, 0, '1954', NULL, 1),
(113, 26, 0, '1945', NULL, 0),
(114, 27, 0, 'Bọn Việt Quốc, Việt Cách', NULL, 0),
(115, 27, 0, 'Bọn Nhật đang còn tại Việt Nam', NULL, 0),
(116, 27, 0, 'Bọn thực dân Anh', NULL, 1),
(117, 27, 0, 'Bọn phản cách mạng', NULL, 0),
(118, 28, 0, 'Ngày 18/12/1946', NULL, 0),
(119, 28, 0, 'Đêm 20/12/1946', NULL, 0),
(120, 28, 0, 'Ngày 22/12/1946', NULL, 0),
(121, 28, 0, 'Đêm 19/12/1946', NULL, 1),
(122, 29, 0, '60 ngày đêm', NULL, 0),
(123, 29, 0, '66 ngày đêm', NULL, 0),
(124, 29, 0, '55 ngày đêm', NULL, 0),
(125, 29, 0, '56 ngày đêm', NULL, 1),
(126, 30, 0, 'Chiến thắng Tây Bắc', NULL, 0),
(127, 30, 0, 'Chiến thắng biên giới', NULL, 0),
(128, 30, 0, 'Chiến thắng Đông Xuân 1953-1954', NULL, 0),
(129, 30, 0, 'Chiến thắng Điện Biên Phủ', NULL, 1),
(130, 31, 0, '938', NULL, 1),
(131, 31, 0, '939', NULL, 0),
(132, 31, 0, '931', NULL, 0),
(133, 31, 0, '937', NULL, 0),
(134, 32, 0, 'Trần Hưng Đạo', NULL, 0),
(135, 32, 0, 'Nguyễn Lữ', NULL, 0),
(136, 32, 0, 'Quang Trung', NULL, 1),
(137, 32, 0, 'Nguyễn Nhạc', NULL, 0),
(138, 33, 0, 'Quân Anh, quân Mỹ', NULL, 0),
(139, 33, 0, 'Quân Anh, quân Trung Hoa Dân Quốc', NULL, 1),
(140, 33, 0, 'Quân Pháp, quân Anh', NULL, 0),
(141, 33, 0, 'Quân Pháp quân Trung Hoa Dân Quốc', NULL, 0),
(142, 34, 0, 'Văn hóa hiện đại theo kiểu phương Tây', NULL, 0),
(143, 34, 0, 'Văn hóa đậm đà bản sắc dân tộc', NULL, 0),
(144, 34, 0, 'Hơn 90% dân số không biết chữ', NULL, 1),
(145, 34, 0, 'Văn hóa mang nặng tư tưởng phản động của phát xít Nhật', NULL, 0),
(146, 35, 0, 'Đế quốc Anh', NULL, 0),
(147, 35, 0, 'Quân Trung Hoa Dân Quốc', NULL, 0),
(148, 35, 0, 'Phát xít Nhật', NULL, 0),
(149, 35, 0, 'Thực dân Pháp', NULL, 1),
(206, 6, 0, '1955', NULL, 0),
(207, 6, 0, 'Một chín bốn lăm', NULL, 1),
(208, 6, 0, '1945', NULL, 1),
(209, 6, 0, '1975', NULL, 0),
(226, 21, 0, 'Chủ tịch', NULL, 0),
(227, 21, 0, 'Chủ tịch hồ chí minh muôn năm lô lô', NULL, 1),
(228, 21, 0, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', NULL, 1),
(229, 21, 0, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', NULL, 0),
(230, 36, 0, '1232', NULL, 1),
(231, 36, 0, '3', NULL, 0),
(232, 36, 0, '2', NULL, 0),
(233, 36, 0, 'Một chính mười một', NULL, 0),
(244, 39, 0, 'asdsad', NULL, 1),
(245, 39, 0, 'asdsad', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `games`
--

CREATE TABLE `games` (
  `GameID` int(11) NOT NULL,
  `PINCode` varchar(16) NOT NULL,
  `GameName` varchar(64) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `SubjectID` int(11) NOT NULL,
  `TimePerQuest` int(11) NOT NULL,
  `CreatedDate` datetime DEFAULT NULL,
  `StartedDate` datetime DEFAULT NULL,
  `FinishedDate` datetime DEFAULT NULL,
  `OpenStatus` int(11) NOT NULL DEFAULT '0',
  `OwnerID` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `games`
--

INSERT INTO `games` (`GameID`, `PINCode`, `GameName`, `SubjectID`, `TimePerQuest`, `CreatedDate`, `StartedDate`, `FinishedDate`, `OpenStatus`, `OwnerID`) VALUES
(2, '62247', 'asdsad', 7, 20, '2019-10-14 15:53:49', NULL, NULL, 0, 1),
(3, '79111', 'Lịch sử Việt Nam', 7, 20, '2019-10-24 14:49:18', '2019-11-01 16:19:29', '2019-11-01 15:28:34', 1, 5),
(4, '00055', 'tfgdf', 6, 20, '2019-10-24 15:50:07', '2019-11-01 15:45:04', NULL, 0, 5),
(5, '12343', 'TETST', 10, 20, '2019-11-01 16:07:36', '2019-11-01 16:07:42', '2019-11-01 16:08:14', 3, 5),
(6, '69180', 'asdsad', 11, 20, '2019-11-01 16:16:43', '2019-11-01 16:19:44', NULL, 1, 5);

-- --------------------------------------------------------

--
-- Table structure for table `games_marks`
--

CREATE TABLE `games_marks` (
  `MarkID` int(11) NOT NULL,
  `GameID` int(11) NOT NULL,
  `PlayerName` varchar(128) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `CorrectAnswers` int(11) NOT NULL,
  `TotalAnswers` int(11) NOT NULL,
  `TotalPoint` int(11) NOT NULL,
  `Ranking` int(11) NOT NULL,
  `CreatedDate` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `games_marks`
--

INSERT INTO `games_marks` (`MarkID`, `GameID`, `PlayerName`, `CorrectAnswers`, `TotalAnswers`, `TotalPoint`, `Ranking`, `CreatedDate`) VALUES
(1, 3, 'Giảng Viên', 7, 15, 692, 1, '2019-11-01 15:28:34');

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
(6, 6, 'CT. Hồ Chí Minh đọc tuyên ngôn độc lập năm bao nhiêu?', NULL, 5),
(7, 6, 'VNCH thành lập năm bao nhiêu?', NULL, 5),
(8, 6, 'Chiến tranh thế giới thứ hai diễn ra khi nào?', NULL, 5),
(9, 6, 'Chiến tranh thế giới thứ nhất diễn ra khi nào?', NULL, 5),
(10, 6, 'Ai đánh tan quân Nam Hán?', NULL, 5),
(11, 6, 'Hồ Chí Minh ra đi tìm đường cứu nước năm nào?', NULL, 5),
(12, 6, 'Chiến thắng Điện Biên Phủ năm bao nhiêu?', NULL, 5),
(13, 6, 'Tên khác của Trần Hưng Đạo?', NULL, 5),
(14, 6, 'Ai đánh tan 30 vạn quân Thanh?', NULL, 5),
(15, 6, 'Trận Trân Châu Cảng diễn ra năm bao nhiêu?', NULL, 5),
(16, 6, 'Thành phố nào của Nhật bị ném bom nguyên tử đầu tiên?', NULL, 5),
(17, 6, 'Tổng thống đầu tiên của nước VNCH là ai?', NULL, 5),
(18, 6, 'Trận mùa hè đỏ lửa diễn ra năm nào?', NULL, 5),
(19, 6, 'Thành Gia Định có từ năm nào?', NULL, 5),
(20, 6, 'Vị vua cuối cùng của triều Nguyễn là ai?', NULL, 5),
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
(35, 7, 'Sau cách mạng tháng 8 năm 1945, chúng ta phải đối mặt với nhiều kẻ thù, trong đó nguy hiểm nhất là?', NULL, 5),
(36, 10, 'Test', NULL, 5),
(39, 11, 'TEST22', NULL, 5);

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
(6, 'Really Nigga', 5),
(7, 'Lịch sử Việt Nam 2', 5),
(8, 'asdasdasd', 1),
(9, 'Olao', 7),
(11, 'ABC', 5);

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
(6, 'student1', '123456789', '', 'Tùng', 'Phạm Sơn', 0, '2019-05-21 12:02:10', NULL, '115000123'),
(7, 'lecturer2', '123456789', '', 'Viên', 'Giảng', 1, '2019-11-01 13:24:47', NULL, '');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `answers`
--
ALTER TABLE `answers`
  ADD PRIMARY KEY (`AnsID`);

--
-- Indexes for table `games`
--
ALTER TABLE `games`
  ADD PRIMARY KEY (`GameID`);

--
-- Indexes for table `games_marks`
--
ALTER TABLE `games_marks`
  ADD PRIMARY KEY (`MarkID`);

--
-- Indexes for table `questions`
--
ALTER TABLE `questions`
  ADD PRIMARY KEY (`QuestID`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`SubjectID`);

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
  MODIFY `AnsID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=246;

--
-- AUTO_INCREMENT for table `games`
--
ALTER TABLE `games`
  MODIFY `GameID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `games_marks`
--
ALTER TABLE `games_marks`
  MODIFY `MarkID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `QuestID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `SubjectID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
