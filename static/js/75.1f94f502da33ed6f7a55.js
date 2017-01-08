webpackJsonp([75,194],{554:function(n,E){n.exports={rawContent:"\n\n随便看看，来自[http://zetcode.com](http://zetcode.com)的教程笔记。放到一个文档里便于通过`Ctrl+F`快速查找。\n\n## 安装\n\n从软件源安装基本是一键安装。\n\n源码安装参见[MySQL installation](http://zetcode.com/databases/mysqltutorial/installation)\n\n## 初步\n\n启动和停止服务，反正gentoo下是\n\n    sudo /etc/init.d/mysqld start\n    sudo /etc/init.d/mysqld stop\n    sudo /etc/init.d/mysqld restart\n\n手动启动`mysqld_safe &`也行。\n\n检查服务是否启动：\n\n     ~/Work/learn/MySQL ⮀ mysqladmin -uroot -p ping\n    Enter password: \n    mysqld is alive\n\n`mysqladmin`还可以用来关闭服务，参见`man mysqladmin`.\n\n`mysql -uroot -p`直接连接到mysql的交互shell中去。\n\n在这个shell中可以使用命令(比如`system pwd`)也可以使用SQL语句，SQL语句以分号结束。\n\n查看数据库:\n\n    SHOW DATABASES;\n\n创建数据库`mydb`\n\n    CREAT DATABASE mydb;\n\n使用数据库`mydb`\n\n    use mydb;\n\n显示数据库中的表：\n\n    SHOW TABLES;\n\n执行数据库文件：\n\n    source cars.sql\n\n从表中选择：\n\n    SELECT * FROM Cars;\n\n创建新用户\n\n    CREATE USER user123@localhost IDENTIFIED BY 'pass123';\n\n授予用户对特定数据库/表的特定权限\n\n    GRANT ALL ON mydb.* to user123@localhost;\n\n## 快速教程\n\nroot用户：\n\n- 创建数据库\n- 使用数据库\n- 导入数据库文件(吐槽下mysql数据库导入的神慢)\n- 授予权限\n\n普通用户：\n\n- 查看数据库\n- 使用数据库\n- 查看表\n\n描述表：\n\n    DESCRIBE City;\n\n查看创建表的命令\n\n    SHOW CREAT TABLE City;\n\n使用`mysqldump`备份表(在系统shell中而不是mysql的交互shell)\n\n    mysqldump -uroot -p world City > city.sql\n\n移除表\n\n    DROP TABLE City;\n\n接着讲讲查表。\n\n限制条数：\n\n    SELECT Id, Name, Population FROM City LIMIT 10;\n    SELECT Id, Name, Population FROM City LIMIT 15, 5;\n\n使用`less`分页，\n\n    pager less\n\n非交互式使用SQL命令\n\n    mysql -u user123 -p world -e \"SELECT * FROM City\" > city\n\nCOUNT函数\n\n    SELECT COUNT(Id) AS 'Number of rows' FROM City;\n\nMAX, 下面命令显示了SQL的子查询特性:\n\n    mysql> SELECT Name, Population FROM City\n        -> WHERE Population = (SELECT Max(Population) FROM City);\n\nMIN:\n\n    mysql> SELECT Name, Population FROM City\n        -> WHERE Population = (SELECT Min(Population) FROM City);\n\nWHERE语句\n\n    mysql> SELECT Name, Population FROM City \n        -> WHERE Population > 1000000;\n\n    mysql> SELECT Name FROM City WHERE Name LIKE 'Kal%';\n\n    mysql> SELECT Name, Population FROM City \n        -> WHERE ID IN (5, 32, 344, 554);\n\n    mysql> SELECT * FROM City WHERE Name = 'Bratislava';\n\n    mysql> SELECT Name, Population FROM City \n        -> WHERE Population BETWEEN 670000 AND 700000;\n\n排序数据\n\n    mysql> SELECT Name, Population FROM City\n        -> ORDER BY Population DESC LIMIT 10;\n\n    mysql> SELECT Name, Population FROM City \n        -> ORDER BY Population ASC LIMIT 10;\n\n    mysql> SELECT Name, Population FROM City \n        -> ORDER BY Name LIMIT 10;\n\n聚合数据\n\n    mysql> SELECT District, SUM(Population) FROM City\n        -> WHERE District = 'Henan' GROUP BY District;\n\n    mysql> SELECT Name, District, Population FROM City\n        -> WHERE District = 'Henan';\n\n    mysql> SELECT District, SUM(Population) FROM City\n        -> WHERE CountryCode = 'USA' GROUP BY District\n        -> HAVING SUM(Population) > 3000000;\n\n更新，删除和插入数据\n\n    mysql> UPDATE Country SET HeadOfState = 'Xi Jinping' \n        -> WHERE Name = 'China';\n\n    mysql> DELETE FROM City WHERE ID IN (2, 4, 6, 8, 10);\n\n    mysql> TRUNCATE TABLE City;\n\n    mysql> INSERT INTO City VALUES(999999, 'Kabul', 'AFG', 'Kabol', 1780000);\n\n    mysql> DROP TABLE City\n\n## MySQL存储引擎\n\n存储引擎是数据库管理系统读写更新数据库中数据的软件模型。\n\nMySQL支持的存储引擎有：\n\n- MyISAM，早于5.5版本的默认引擎\n- InnoDB\n- Memory\n- CSV\n- 等等\n\n情况很复杂，选择之前最好上[StackOverFlow](http://stackoverflow.com/)问问。\n\n创建表时使用`ENGINE`关键字指定引擎：\n\n    mysql> CREATE TABLE Cars(Id INTEGER PRIMARY KEY, Name VARCHAR(50), \n        -> Cost INTEGER) ENGINE='MyISAM';\n\n查看当前引擎：\n\n    mysql> SHOW VARIABLES LIKE 'storage_engine';\n\n发现特定数据库的表引擎\n\n    mysql> SELECT ENGINE FROM information_schema.TABLES\n        -> WHERE TABLE_SCHEMA='mydb'\n        -> AND TABLE_NAME='Cars';\n\n更改表的引擎：\n\n    mysql> ALTER TABLE Cars ENGINE='InnoDB';\n\n## MySQL数据类型\n\n### 数值\n\n整数：\n\n|Data type \t|Bytes \t|Minimum value \t            |Maximum value      |\n|-----------|-------|---------------------------|-------------------|\n|TINYINT \t|1      |-128 \t                    |127                |\n|SMALLINT \t|2      |-32768 \t                |32767              |\n|MEDIUMINT \t|3      |-8388608 \t                |8388607            |\n|INTEGER \t|4      |-2147483648                |2147483647         |\n|BIGINT \t|8      |-9223372036854775808 \t    |9223372036854775807|\n\n\n浮点：\n\n|Data type \t|Bytes \t|\n|-----------|-------|\n|FLOAT      |4      |\n|DOUBLE     |8      |\n|DECIML     |(M位，小数点后D位)|\n\n\n定义表时指定：\n\n    mysql> CREATE TABLE Numbers (Id TINYINT, Floats FLOAT, Decimals DECIMAL(3, 2));\n\n更改列字段内型：\n\n    mysql> ALTER TABLE Ages MODIFY Age TINYINT UNSIGNED;\n\n插入值\n\n    mysql> INSERT INTO Numbers VALUES (1, 1.1, 1.1), (2, 1.1, 1.1), (3, 1.1, 1.1);\n\nDECIMAL类型更加精确，FLOAT和DOUBLE都只是近似。\n\n### 日期和时间\n\n有这么几种：\n\n|Data type \t|范围 \t                            |显示格式   |\n|-----------|-----------------------------------|-----------|\n|DATE       |  '1000-01-01' 到 '9999-12-31'.    |YYYY-MM-DD |\n|TIME       |  '-838:59:59' to '838:59:59'.     |HH:MM:SS   |\n|DATETIME   | '1000-01-01 00:00:00' to '9999-12-31 23:59:59'.|YYYY-MM-DD HH:MM:SS|\n|YEAR       | 1901 to 2155 | YYYY |\n|TIMESTAMP  | '1970-01-01 00:00:01' UTC to '2038-01-19 03:14:07' UTC |见下表|\n\n|Data type      |Format         |\n|---------------|---------------|\n|TIMESTAMP(14)  |YYYYMMDDHHMMSS |\n|TIMESTAMP(12)  |YYMMDDHHMMSS   |\n|TIMESTAMP(10)  |YYMMDDHHMM     |\n|TIMESTAMP(8)   |YYYYMMDD       |\n|TIMESTAMP(6)   |YYMMDD         |\n|TIMESTAMP(4)   |YYMM           |\n|TIMESTAMP(2)   |YY             |\n \nDATE、DATETIME和DATE输入时可支持多种格式，分隔符可以任意，超出范围截断到0.\n\n    mysql> CREATE TABLE Dates(Id TINYINT, Dates DATE);\n    mysql> INSERT INTO Dates VALUES(1, '2011-01-24');\n    mysql> INSERT INTO Dates VALUES(2, '2011/01/25');\n    mysql> INSERT INTO Dates VALUES(3, '20110126');\n    mysql> INSERT INTO Dates VALUES(4, '110127');\n    mysql> INSERT INTO Dates VALUES(5, '2011+01+28');\n\n`TIMEDIFF`计算时差：\n\n    mysql> SELECT TIMEDIFF('23:34:32', '22:00:00');\n\n`TIME`函数提取时间部分\n\n    mysql> SELECT TIME('2011-01-29 11:27:42');\n\n`DAYNAME`函数提取星期名。\n\n    mysql> SELECT DAYNAME('2011@01@29 11@50@13');\n\nMySQL自动填充TIMESTAMP列，记录`INSERT`和`UPDATE`时间。\n\n### 字符串\n\n|Data type      |Format                 |备注                |\n|---------------|-----------------------|--------------------|\n|CHAR           |CHAR(x),x=0:255        |定长字符串存储      |\n|VARCHAR        |VARCHAR(x),x=0:65535   |变长字符串数据存储  |\n|BINARY         |BINARY(x),x=0:255      |定长字节存储        |\n|VARBINARY      |VARBINARY(x),x=0:65535 |变长字节存储        |\n|TINYBLOB       |0-255                  |BLOB存储大二进制对象|\n|BLOB           |0-65535                |                    |\n|MEDIUMBLOB     |0 - 16777215           |                    |\n|LONGBLOB       |0 - 4294967295         |                    |\n|TINYTEXT       |0-255                  |TEXT存储大文本数据  |\n|TEXT           |0-65535                |                    |\n|MEDIUMTEXT     |0 - 16777215           |                    |\n|LONGTEXT       |0 - 4294967295         |                    |\n\n`ENUM`创建一个只能插入列表中特定值的表\n\n    mysql> CREATE TABLE SizeTable(Size ENUM('S', 'M', 'L', 'XL', 'XXL'));\n\n`SET`类似于`ENUM`，但可以包含0个或多个列表中的值。\n\n## 创建、更改和删除表\n\n### 创建指令\n\n创建一个表，指定表名、列的名称和类型：\n\n    mysql> CREATE TABLE Testing(Id INTEGER);\n\n查看某个表的建表语句\n\n    mysql> SHOW CREATE TABLE Testing;\n\n创建的，非临时表可以通过`SHOW TABLES`语法查看：\n\n    mysql> SHOW TABLES LIKE 'T%';\n\n## 删除表\n\n删除表：\n\n    mysql> DROP TABLE Testing;\n\n## 更改表\n\n使用`ALTER TABLE`语法更改表。以下为重命名表、添加列、添加主键、更改列、删除列操作。(DESCRIBE和SHOW COLUMNS FROM同义，INTEGER和INT相同)\n\n    mysql> ALTER TABLE Testing RENAME TO TestTable;\n    mysql> ALTER TABLE TestTable ADD iValues INT;\n    mysql> ALTER TABLE TestTable ADD PRIMARY KEY (Id);\n    mysql> ALTER TABLE TestTable CHANGE COLUMN iValues iValues1 INT;\n    mysql> ALTER TABLE TestTable DROP COLUMN iValues1;\n\n## MySQL表达式\n\n### 字面常量\n\n    mysql> SELECT 3, 'Wolf', 34.5, 0x34, 0+b'10111';\n    mysql> SELECT NULL, \\N;\n    mysql> SELECT TRUE, FALSE;\n    mysql> SELECT '2011-01-11', '23:33:01', '98/11/31/ 14:22:20';\n\n### 变量\n\n    mysql> SET @name = 'Jane';\n    mysql> SELECT @name;\n\n### 运算符\n\n包括一元的\n\n    mysql> SELECT NOT (3>9);\n\n算术的：\n\n    mysql> SELECT 9/2, 9 DIV 2;\n\n逻辑的：\n\n    mysql> SELECT FALSE XOR FALSE, FALSE XOR TRUE,\n    -> TRUE XOR FALSE, TRUE XOR TRUE;\n\n关系的：\n\n    mysql> SELECT 3 * 3 = 9, 9 = 9, 3 < 4, 3 <> 5, 4 <= 4, 5 != 5;\n\n位的：\n\n    mysql> SELECT 6 | 3, 6 & 3, 6 << 1;\n\n其它：\n\n    mysql> SET @running = FALSE;\n    mysql> SELECT @running IS FALSE;\n    mysql> SELECT 'Tom' IN ('Tom', 'Frank', 'Jane');\n    mysql> SELECT * FROM Cars Where Name IN ('Audi', 'Hummer');\n    mysql> SELECT * FROM Cars WHERE Name LIKE 'Vol%';\n    mysql> SELECT * FROM Cars WHERE Name LIKE '____';\n    mysql> SELECT * FROM Cars WHERE Name REGEXP 'e.$';\n    mysql> SELECT * FROM Cars WHERE Name REGEXP '^.e.*e.$';\n    mysql> SELECT * FROM Cars WHERE Cost BETWEEN 20000 AND 55000;\n\n### 优先级\n\n加个括号吧\n\n同级运算符从左到右执行\n\n## 插入、更新和删除数据\n\n## 插入\n\n插入时可以指定插入的列，也可以不指定\n\n    mysql> INSERT INTO Books(Id, Title, Author) VALUES(1, 'War and Peace', \n    -> 'Leo Tolstoy');\n    mysql> INSERT INTO Books VALUES(3, 'Crime and Punishment',\n    -> 'Fyodor Dostoyevsky');\n\n若不指定`Id`也可。\n\n    mysql> INSERT INTO Books(Title, Author) VALUES ('The Brothers Karamazov',\n    -> 'Fyodor Dostoyevsky');\n\n一次可以插入单个或多个值\n\n    mysql> INSERT INTO Books(Title, Author) VALUES ('The Insulted and Humiliated',\n    -> 'Fyodor Dostoyevsky'), ('Cousin Bette', 'Honore de Balzac');\n\n`REPLACE`可以取代特定行：\n\n    mysql> REPLACE INTO Books VALUES(3, 'Paradise Lost', 'John Milton');\n\n插入也可以和`SELECT`结合：\n\n    mysql> INSERT INTO Books2 SELECT * FROM Books;\n\n可以使用`LOAD DATA INFILE`和`LOAD XML INFILE`语法从文件插入：\n\n    mysql> LOAD DATA INFILE '/tmp/books.csv'    \n        -> INTO TABLE Books    \n        -> FIELDS TERMINATED BY ','    \n        -> LINES TERMINATED BY '\\n';\n\n    mysql> LOAD XML INFILE '/home/vronskij/programming/mysql/books.xml' INTO TABLE Books;\n\n### 删除\n\n从表中删除：\n\n    mysql> DELETE FROM Books2 WHERE Id=1;\n    mysql> DELETE FROM Books2;\n    mysql> TRUNCATE Books2;\n\n### 更新\n\n`UPDATE`用于变更选中行的列值。\n\nmysql> UPDATE Books SET Author='Lev Nikolayevich Tolstoy'\n    -> WHERE Id=1;\n\n## SELECT语句\n\n### 获取数据\n\n选择所有内容\n\n    mysql> SELECT * FROM Cars;\n\n选择特定的列\n\n    mysql> SELECT Name, Cost FROM Cars;\n\n可以重命名列名：\n\n    mysql> SELECT Name, Cost AS Price FROM Cars;\n\n限制输出个数：\n\n    mysql> SELECT * FROM Cars LIMIT 4;\n    mysql> SELECT * FROM Cars LIMIT 2, 4;\n    mysql> SELECT * FROM Cars LIMIT 4 OFFSET 2;  # 同上\n\n### 排序数据\n\n以降序(`DESC`)或升序(`ASC`)排序：\n\n    mysql> SELECT Name, Cost FROM Cars ORDER BY Cost DESC;\n\n### WHERE\n\nWHERE语句就像个过滤器：\n\n    mysql> SELECT * FROM Orders WHERE Customer=\"Smith\";\n    mysql> SELECT * FROM Orders WHERE Customer LIKE \"B%\";\n\n### 移除重复项\n\n`DISTINCT`从结果中选择唯一的结果集。\n\n    mysql> SELECT DISTINCT Customer FROM Orders WHERE Customer LIKE 'B%';\n\n`COUNT`函数统计个数\n\n    mysql> SELECT COUNT(Customer) AS \"Orders by Brown\" FROM Orders WHERE Customer=\"Brown\";\n\n## 聚合数据\n\n`GROUP BY`语句被用来结合值一样的数据库记录到一个单一的记录中。通常和聚合函数一起使用。\n\n    mysql> SELECT SUM(OrderPrice) AS Total, Customer FROM Orders GROUP BY Customer;\n\n使用聚合函数时不能使用`WHERE`而是使用`HAVING`：\n\n    mysql> SELECT SUM(OrderPrice) AS Total, Customer FROM Orders\n        -> GROUP BY Customer HAVING SUM(OrderPrice)>1000;\n\n### 选择内容到文件\n\n`SELECT`语句能被用来写入表到文件中：\n\n    mysql> SELECT * INTO OUTFILE '/tmp/cars.txt'\n        -> FIELDS TERMINATED BY ','\n        -> LINES TERMINATED BY '\\n'\n        -> FROM Cars;\n\n## 子查询\n\n又称嵌套查询，可以和`INSERT`、`SELECT`、`UPDATE`和`DELETE`配合使用：\n\n    mysql> INSERT INTO Cars2 SELECT * FROM Cars;\n    mysql> SELECT Name FROM Customers WHERE \n    -> CustomerId=(SELECT CustomerId FROM Reservations WHERE Id=5);\n    mysql> SELECT Name FROM Customers WHERE CustomerId IN    \n    -> (SELECT DISTINCT CustomerId FROM Reservations);\n    mysql> SELECT Name FROM Cars WHERE Cost <\n    -> (SELECT AVG(Cost) FROM Cars);\n\n`EXISTS`和`NOT EXISTS`：\n\n    mysql> SELECT Name FROM Customers WHERE EXISTS\n    -> (SELECT * FROM Reservations WHERE\n    -> Customers.CustomerId=Reservations.CustomerId);\n    mysql> SELECT Name FROM Customers WHERE NOT EXISTS    \n    -> (SELECT * FROM Reservations WHERE \n    -> Customers.CustomerId=Reservations.CustomerId);\n\n## 限制\n\n限制用来限定列的类型。\n\n`NOT NULL`：\n\n    mysql> CREATE TABLE People(Id INTEGER, LastName TEXT NOT NULL,\n    ->                     FirstName TEXT NOT NULL, City VARCHAR(55));\n\n`UNIQUE`：\n\n    mysql> CREATE TABLE Brands(Id INTEGER, BrandName VARCHAR(30) UNIQUE);\n\n`PRIMARY KEY`自动拥有`UNIQUE`和`NOT NULL`：\n\n    mysql> CREATE TABLE Brands(Id INTEGER PRIMARY KEY, BrandName VARCHAR(30) UNIQUE);\n\n`FOREIGN KEY`是指向另一个表主键的索引，用来联系两个表：\n\n    mysql> CREATE TABLE Books(BookId INTEGER PRIMARY KEY, Title VARCHAR(50),\n        -> AuthorId INTEGER, FOREIGN KEY(AuthorId) REFERENCES Authors(AuthorId))\n        -> type=InnoDB;\n\n`ENUM`可以是列出中的一个：\n\n    mysql> CREATE TABLE Shops(Id INTEGER, Name VARCHAR(55), \n        -> Quality ENUM('High', 'Average', 'Low'));\n\n`SET`可以是零个或多个：\n\n    mysql> CREATE TABLE Students(Id INTEGER, Name VARCHAR(55), \n        -> Certificates SET('A1', 'A2', 'B1', 'C1')); \n\n注意插入时`Certificates`列的值用括号括起来，之间用逗号分隔且不能有空格。\n\n    mysql> INSERT INTO Students VALUES(3, 'Mark', 'A1,A2,D1,D2');\n\n## 导出和导入数据\n\n简单导出到文件和导入到数据库：\n\n    mysql> SELECT * FROM Cars INTO OUTFILE '/tmp/cars';  # 空格分隔\n    mysql> LOAD DATA INFILE '/tmp/cars.csv' INTO TABLE Cars\n    -> FIELDS TERMINATED BY ',';\n\n导入到xml文件：\n\n    $ mysql -uroot -p --xml -e 'SELECT * FROM mydb.Cars' > /tmp/cars.xml\n    mysql> LOAD XML /tmp/cars.xml INTO TABLE Cars;\n\n使用mysqldump工具：\n\n只保存数据结构：\n\n    $ mysqldump -u root -p --no-data mydb > bkp1.sql\n\n只保存数据\n\n    $ mysqldump -uroot -p --no-create-info mydb > bkp2.sql\n\n完整数据库\n\n    $ mysqldump -uroot -p mydb > bkp3.sql\n\n恢复数据：\n\n    mysql> CREATE DATABASE mydb;\n    mysql> USE mydb;\n    mysql> source bkp3.sql\n\n## 连接表\n\n### 内连接\n\n分`INNER JOIN`、`NATURAL INNER JOIN`和`CROSS INNER JOIN`三种， `INNER`关键字可省略。以下是`INNER JOIN`\n\n    mysql> SELECT Name, Day FROM Customers AS C JOIN Reservations \n        -> AS R ON C.CustomerId=R.CustomerId;\n    mysql> SELECT Name, Day FROM Customers, Reservations\n        -> WHERE Customers.CustomerId=Reservations.CustomerId;\n\n`CROSS JOIN`是两个表的笛卡尔乘积。\n\n    mysql> SELECT Name, Day FROM Customers CROSS JOIN Reservations;\n    mysql> SELECT Name, Day FROM Customers, Reservations;\n\n### 外连接\n\n左内连，选取左边所有的值：\n\n    mysql> SELECT Name, Day FROM Customers LEFT JOIN Reservations\n        -> ON Customers.CustomerId=Reservations.CustomerId;\n    mysql> SELECT Name, Day FROM Customers LEFT JOIN Reservations\n        -> USING (CustomerId);\n\n右内连，同上，孤单的右边值对应的左边为`NULL`\n\n    mysql> SELECT Name, Day FROM Customers RIGHT JOIN\n        -> Reservations USING (CustomerId);\n\n自然连，会把所有列连在一起：\n\n    mysql> SELECT Name, Day FROM Customers NATURAL JOIN Reservations;\n    mysql> SELECT Name, Day FROM Customers \n        -> NATURAL LEFT JOIN Reservations;\n    mysql> SELECT Name, Day FROM Customers\n        -> NATURAL RIGHT JOIN Reservations;\n\n## MySQL函数\n\n### 数学函数\n\n    mysql> SELECT RAND(), ABS(-3), PI(), SIN(0.5),\n         > BIN(22), OCT(22), HEX(22)\n         > CEIL(11.256), FLOOR(11.256), ROUND(11.256, 2),\n         > POW(3, 3), SQRT(9),\n         > DEGREES(2*PI());\n\n### 聚合函数\n\n    mysql> SELECT MIN(Cost), MAX(Cost), AVG(Cost)\n        -> FROM Cars;\n    mysql> SELECT SUM(Cost), COUNT(Id), STD(Cost), \n        -> VARIANCE(Cost) FROM Cars;\n\n### 字符串函数\n\n    mysql> SELECT LENGTH('ZetCode'), UPPER('ZetCode'), LOWER('ZetCode');\n    mysql> SELECT LPAD(RPAD(\"ZetCode\", 10, \"*\"), 13, \"*\");\n    mysql> SELECT REVERSE('ZetCode'), REPEAT('*', 6);\n    mysql> SELECT LEFT('ZetCode', 3), RIGHT('ZetCode', 3), \n        -> SUBSTRING('ZetCode', 3, 3);\n    mysql> SELECT STRCMP('byte', 'byte'), CONCAT('three', ' apples');\n    mysql> SELECT REPLACE('basketball', 'basket', 'foot');\n\n### 日期时间函数\n\n    mysql> SELECT DAYNAME('2011-01-23'), YEAR('2011/01/23'),\n        -> MONTHNAME('110123');\n    mysql> SELECT NOW();\n    mysql> SELECT CURTIME(), CURDATE();\n    mysql> SELECT DATEDIFF('2011-3-12', '2011-1-12');\n    mysql> SELECT WEEKOFYEAR('110123'), WEEKDAY('110123'),\n        -> QUARTER('110123');\n    mysql> SELECT DATE_FORMAT('110123', '%d-%m-%Y');\n    mysql> SELECT DATE_ADD('110123', INTERVAL 45 DAY), \n        -> SUBDATE('110309', INTERVAL 45 DAY);\n\n### 系统函数\n\n    mysql> SELECT VERSION(), DATABASE();\n    mysql> SELECT USER();\n    mysql> SELECT CHARSET('ZetCode'), COLLATION('ZetCode');\n\n## MySQL视图\n\n视图是一种从表中切取的特殊伪表。有以下限制：\n\n- `SELECT`不能包含子查询\n- `SELECT`语句不能指向系统或用户变量\n- 在定义中指向的任何表或视图必须存在\n- 不能创建临时视图\n- 一个视图不能被触发关联。\n\n创建、更改和删除视图：\n\n    mysql> CREATE VIEW CheapCars AS \n        -> SELECT Name FROM Cars WHERE Cost<25000;\n    mysql> ALTER VIEW CheapCars AS SELECT Name FROM Cars\n        -> WHERE Cost<30000;\n    mysql> DROP VIEW CheapCars;\n\n找到视图：\n\n    mysql> SHOW FULL TABLES;\n    mysql> SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES;\n    mysql> SELECT TABLE_NAME FROM information_schema.VIEWS;\n\n`UNION`被用来结合两个或更多`SELECT`语句得到的结果集，可以通过`UNION`创建视图\n\n    mysql> CREATE VIEW FavoriteCars AS\n        -> SELECT * FROM Cars WHERE Id=7\n        -> UNION SELECT * FROM Cars WHERE Id=4\n        -> UNION SELECT * FROM Cars WHERE Id=5;\n\n## 事务\n\n数据库并发操作控制单位。这些操作可以commit可以回滚。\n\n解释下ACID。\n\n### 隔离级\n\n- 序列，一个接一个\n- 重复读，读的时候其它事务没提交就没法修改，改的时候没提交其它事务就没法读，默认级别。\n- 读提交。\n- 读未提交。\n\n1. 脏读(事务没提交，提前读取)：脏读就是指当一个事务正在访问数据，并且对数据进行了修改，而这种修改还没有提交到数据库中，这时，另外一个事务也访问这个数据，然后使用了这个数据。 \n2. 不可重复读(两次读的不一致) ：是指在一个事务内，多次读同一数据。在这个事务还没有结束时，另外一个事务也访问该同一数据。那么，在第一个事务中的两次读数据之间，由于第二个事务的修改，那么第一个事务两次读到的的数据可能是不一样的。这样就发生了在一个事务内两次读到的数据是不一样的，因此称为是不可重复读。例如，一个编辑人员两次读取同一文档，但在两次读取之间，作者重写了该文档。当编辑人员第二次读取文档时，文档已更改。原始读取不可重复。如果只有在作者全部完成编写后编辑人员才可以读取文档，则可以避免该问。\n3. 幻读 : 是指当事务不是独立执行时发生的一种现象，例如第一个事务对一个表中的数据进行了修改，这种修改涉及到表中的全部数据行。同时，第二个事务也修改这个表中的数据，这种修改是向表中插入一行新数据。那么，以后就会发生操作第一个事务的用户发现表中还有没有修改的数据行，就好象发生了幻觉一样。例如，一个编辑人员更改作者提交的文档，但当生产部门将其更改内容合并到该文档的主复本时，发现作者已将未编辑的新材料添加到该文档中。如果在编辑人员和生产部门完成对原始文档的处理之前，任何人都不能将新材料添加到文档中，则可以避免该问题。 \n\n默认隔离级和可能出现情况：\n\n|隔离级别           |Phantom read |Nonrepeatable read |Dirty read   |\n|-------------------|-------------|-------------------|-------------|\n|序列化             |不可能       |不可能             |不可能       |\n|可重读             |可能         |不可能             |不可能       |\n|读提交             |可能         |可能               |不可能       |\n|读未提交           |可能         |可能               |可能         |\n\n查看和选择隔离级别\n\n    mysql> SELECT @@tx_isolation;\n    mysql> SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;\n\n### 自动提交\n\nMySQL会自动提交不以`START`开头的`UPDATE`和`INSERT`语句。查看和设置当前设置：\n\n    mysql> SELECT @@autocommit;\n    mysql> SET autocommit=0;\n\n提交后的状态无法回滚。`ROLLBACK`\n\n### 开始事务\n\n自动提交的命令会被MySQL封装为一个单独的事务。我们也可以用`START`语句实现。\n\n    mysql> START TRANSACTION;\n\n之后可以执行命令提交或者回滚：\n\n提交\n\n    mysql> INSERT INTO Test VALUES (5), (6);\n    mysql> INSERT INTO Test VALUES (7), (8);\n    mysql> COMMIT;\n\n回滚\n\n    mysql> INSERT INTO Test VALUES (5), (6);\n    mysql> INSERT INTO Test VALUES (7), (8);\n    mysql> ROLLBACK;\n\n## 在MySQL中存储例程\n\n在MySQL中存在两种存储例程，一种是过程，一种是函数。\n\n过程用`CALL`调用，不返回值。函数通过`SELECT`使用，返回值。\n\n过程存储有利有弊。\n\n### 一个简单过程\n\n创建`AllCars`g过程选取`Cars`表中所有内容：\n\n    mysql> CREATE PROCEDURE AllCars() SELECT * FROM Cars;\n    mysql> CALL AllCars();\n\n### 一个简单函数\n\n定义过程和函数最好的方法是一个单独的sql文件。以下是创建了一个`sql`文件。通过`CREATE FUNCTION`创建函数，通过`SELECT`语句调用。\n\n    -- this function computes the area\n    -- of a circle; it takes a radius as\n    -- a parameter\n    \n    DELIMITER $$\n    \n    DROP FUNCTION IF EXISTS CircleArea;\n    \n    CREATE FUNCTION CircleArea(r DOUBLE) RETURNS DOUBLE\n    BEGIN\n        DECLARE area DOUBLE;\n    \n        SET area = r * r * pi();\n        RETURN area;\n    END \n    \n    $$\n    \n    DELIMITER ;\n\n函数调用：\n\n    mysql> source circlearea.sql\n    mysql> SELECT CircleArea(5.5);\n\n### 过程参数\n\n有三种参数内型：\n\n- IN，传递给过程，只能在函数内修改\n- OUT，输出参数，并不从外部传递给过程\n- INOUT，混合内型，可以传递给过程来更改也可以在过程外部存取。\n\n在sql文件中定义过程：\n\n    -- this procedure computes the power \n    -- of a given value\n    \n    DELIMITER $$\n    \n    DROP PROCEDURE IF EXISTS Pow;\n    \n    CREATE PROCEDURE Pow(IN val DOUBLE, OUT p DOUBLE) \n    BEGIN\n        SET p = val * val;\n    END \n    \n    $$\n    \n    DELIMITER ;\n\n调用：\n\n    mysql> source power.sql\n    \n    mysql> CALL Pow(3, @p);\n    \n    mysql> SELECT @p;\n\n### 找到过程或函数\n\n通过`SHOW PROCEDURE STATUS`和`SHOW FUNCTION STATUS`查看。\n\n或者\n\n    mysql> SELECT SPECIFIC_NAME from information_schema.ROUTINES  \n        -> WHERE ROUTINE_TYPE='PROCEDURE';\n    mysql> SELECT SPECIFIC_NAME from information_schema.ROUTINES \n        -> WHERE ROUTINE_TYPE='FUNCTION';\n\n## MySQL C API\n\nMySQL有个C API\n\ndebian上要装这个：\n\n    $ sudo apt-get install libmysqlclient-dev\n\n我们只要在头文件中包含`mysql.h`，编译时以以下方式编译：\n\n    $ gcc version.c -o version  `mysql_config --cflags --libs`\n\n基本步骤是先初始化连接：\n\n    MYSQL *con = mysql_init(NULL);\n\n    if (con == NULL) \n    {\n        fprintf(stderr, \"%s\\n\", mysql_error(con));\n        exit(1);\n    }\n\n再真的连到服务器或某个数据库中：\n\n    if (mysql_real_connect(con, \"localhost\", \"root\", \"root_pswd\", \n            NULL, 0, NULL, 0) == NULL) \n    {\n        fprintf(stderr, \"%s\\n\", mysql_error(con));\n        mysql_close(con);\n        exit(1);\n    }\n\n执行操作：\n\n    if (mysql_query(con, \"CREATE DATABASE testdb\")) \n    {\n        fprintf(stderr, \"%s\\n\", mysql_error(con));\n        mysql_close(con);\n        exit(1);\n    }\n\n取回数据：\n\n    MYSQL_RES *result = mysql_store_result(con);\n    \n    if (result == NULL) \n    {\n        finish_with_error(con);\n    }\n    \n    int num_fields = mysql_num_fields(result);\n    \n    MYSQL_ROW row;\n    \n    while ((row = mysql_fetch_row(result))) \n    { \n        for(int i = 0; i < num_fields; i++) \n        { \n            printf(\"%s \", row[i] ? row[i] : \"NULL\"); \n        } \n            printf(\"\\n\"); \n    }\n    \n    mysql_free_result(result);\n\n还有些其它函数，参考[http://dev.mysql.com/doc/refman/5.1/zh/apis.html](http://dev.mysql.com/doc/refman/5.1/zh/apis.html)\n\n\n",metaData:{layout:"post",title:"MySQL Learning Notes",excerpt:"好吧，工作要用",category:"SQL",tags:["SQL"],disqus:!0}}}});