-- phpMyAdmin SQL Dump
-- version 4.7.4
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 01, 2019 at 03:07 PM
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
(250, 41, 0, 'Number, String, Boolean', NULL, 0),
(251, 41, 0, 'Number, Interger, char', NULL, 0),
(252, 41, 0, 'Number, String, Boolean, Null', NULL, 0),
(253, 41, 0, 'Tất cả các loại trên', NULL, 1),
(265, 45, 0, 'Có', NULL, 1),
(266, 45, 0, 'Không', NULL, 0),
(271, 43, 0, '<script href=\"xyz.js\">', NULL, 0),
(272, 43, 0, '<script name=\"xyz.js\">', NULL, 0),
(273, 43, 0, '<script src=\"xyz.js\">', NULL, 1),
(274, 43, 0, '<script where=\"xyz.js\">', NULL, 0),
(303, 40, 0, '<js>', NULL, 0),
(304, 40, 0, '<script>', NULL, 1),
(305, 40, 0, '<js>', NULL, 0),
(306, 40, 0, '<scripting>', NULL, 0),
(319, 42, 0, '<!-- Đây là một comment trên nhiều dòng -->', NULL, 0),
(320, 42, 0, '// Đây là một comment trên nhiều dòng // ', NULL, 0),
(321, 42, 0, '/* Đây là một comment trên nhiều dòng */ ', NULL, 1),
(334, 44, 0, 'Chỉ trong phần <head>', NULL, 0),
(335, 44, 0, 'Chỉ trong phần <body>', NULL, 1),
(336, 44, 0, 'Chỉ trong phần <footer>', NULL, 0),
(337, 44, 0, 'Trong phần <head> hoặc <body>', NULL, 0),
(338, 46, 0, 'var chars = [\"a\", \"b\", \"c\"];', NULL, 1),
(339, 46, 0, 'var chars = 1 = (\"a\"), 2 = (\"b\"), 3 = (\"c\");', NULL, 0),
(340, 46, 0, 'var chars = \"a\", \"b\", \"c\";', NULL, 0),
(341, 46, 0, 'var chars = (1:\"a\", 2:\"b\", 3:\"c\");', NULL, 0);

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
(7, '97775', 'Tôi yêu Javascript', 12, 15, '2019-11-01 20:39:09', '2019-11-01 21:06:27', '2019-11-01 20:53:30', 0, 5);

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
(3, 7, 'Phạm Sơn Tùng', 7, 7, 603, 1, '2019-11-01 20:53:30');

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
(40, 12, 'Thẻ nào của HTML cho phép bạn đặt mã nguồn JavaScript vào trang web? ', NULL, 5),
(41, 12, 'JavaScript các kiểu biến dạng nào?', NULL, 5),
(42, 12, 'Cách nào để thêm một comment nhiều dòng trong JavaScript?', NULL, 5),
(43, 12, 'Câu lệnh nào đúng thực hiện việc gọi một script từ bên ngoài có tên là “xxx.js”? ', NULL, 5),
(44, 12, 'Nơi bạn có thể đặt code JavaScript trong trang web? ', NULL, 5),
(45, 12, 'Ngôn ngữ JavaScript có phân biệt chữ hoa, chữ thường?', NULL, 5),
(46, 12, 'Cách khai báo mảng nào trong JavaScript là đúng?', NULL, 5);

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
(8, 'asdasdasd', 1),
(9, 'Olao', 7),
(12, 'Javascript Vui', 5);

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
  MODIFY `AnsID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=342;

--
-- AUTO_INCREMENT for table `games`
--
ALTER TABLE `games`
  MODIFY `GameID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `games_marks`
--
ALTER TABLE `games_marks`
  MODIFY `MarkID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `questions`
--
ALTER TABLE `questions`
  MODIFY `QuestID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `SubjectID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
