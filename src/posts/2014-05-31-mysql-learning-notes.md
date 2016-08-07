---
layout: post
title: "MySQL Learning Notes"
excerpt: "好吧，工作要用"
category: SQL
tags: [SQL]
disqus: true
---


随便看看，来自[http://zetcode.com](http://zetcode.com)的教程笔记。放到一个文档里便于通过`Ctrl+F`快速查找。

## 安装

从软件源安装基本是一键安装。

源码安装参见[MySQL installation](http://zetcode.com/databases/mysqltutorial/installation)

## 初步

启动和停止服务，反正gentoo下是

    sudo /etc/init.d/mysqld start
    sudo /etc/init.d/mysqld stop
    sudo /etc/init.d/mysqld restart

手动启动`mysqld_safe &`也行。

检查服务是否启动：

     ~/Work/learn/MySQL ⮀ mysqladmin -uroot -p ping
    Enter password: 
    mysqld is alive

`mysqladmin`还可以用来关闭服务，参见`man mysqladmin`.

`mysql -uroot -p`直接连接到mysql的交互shell中去。

在这个shell中可以使用命令(比如`system pwd`)也可以使用SQL语句，SQL语句以分号结束。

查看数据库:

    SHOW DATABASES;

创建数据库`mydb`

    CREAT DATABASE mydb;

使用数据库`mydb`

    use mydb;

显示数据库中的表：

    SHOW TABLES;

执行数据库文件：

    source cars.sql

从表中选择：

    SELECT * FROM Cars;

创建新用户

    CREATE USER user123@localhost IDENTIFIED BY 'pass123';

授予用户对特定数据库/表的特定权限

    GRANT ALL ON mydb.* to user123@localhost;

## 快速教程

root用户：

- 创建数据库
- 使用数据库
- 导入数据库文件(吐槽下mysql数据库导入的神慢)
- 授予权限

普通用户：

- 查看数据库
- 使用数据库
- 查看表

描述表：

    DESCRIBE City;

查看创建表的命令

    SHOW CREAT TABLE City;

使用`mysqldump`备份表(在系统shell中而不是mysql的交互shell)

    mysqldump -uroot -p world City > city.sql

移除表

    DROP TABLE City;

接着讲讲查表。

限制条数：

    SELECT Id, Name, Population FROM City LIMIT 10;
    SELECT Id, Name, Population FROM City LIMIT 15, 5;

使用`less`分页，

    pager less

非交互式使用SQL命令

    mysql -u user123 -p world -e "SELECT * FROM City" > city

COUNT函数

    SELECT COUNT(Id) AS 'Number of rows' FROM City;

MAX, 下面命令显示了SQL的子查询特性:

    mysql> SELECT Name, Population FROM City
        -> WHERE Population = (SELECT Max(Population) FROM City);

MIN:

    mysql> SELECT Name, Population FROM City
        -> WHERE Population = (SELECT Min(Population) FROM City);

WHERE语句

    mysql> SELECT Name, Population FROM City 
        -> WHERE Population > 1000000;

    mysql> SELECT Name FROM City WHERE Name LIKE 'Kal%';

    mysql> SELECT Name, Population FROM City 
        -> WHERE ID IN (5, 32, 344, 554);

    mysql> SELECT * FROM City WHERE Name = 'Bratislava';

    mysql> SELECT Name, Population FROM City 
        -> WHERE Population BETWEEN 670000 AND 700000;

排序数据

    mysql> SELECT Name, Population FROM City
        -> ORDER BY Population DESC LIMIT 10;

    mysql> SELECT Name, Population FROM City 
        -> ORDER BY Population ASC LIMIT 10;

    mysql> SELECT Name, Population FROM City 
        -> ORDER BY Name LIMIT 10;

聚合数据

    mysql> SELECT District, SUM(Population) FROM City
        -> WHERE District = 'Henan' GROUP BY District;

    mysql> SELECT Name, District, Population FROM City
        -> WHERE District = 'Henan';

    mysql> SELECT District, SUM(Population) FROM City
        -> WHERE CountryCode = 'USA' GROUP BY District
        -> HAVING SUM(Population) > 3000000;

更新，删除和插入数据

    mysql> UPDATE Country SET HeadOfState = 'Xi Jinping' 
        -> WHERE Name = 'China';

    mysql> DELETE FROM City WHERE ID IN (2, 4, 6, 8, 10);

    mysql> TRUNCATE TABLE City;

    mysql> INSERT INTO City VALUES(999999, 'Kabul', 'AFG', 'Kabol', 1780000);

    mysql> DROP TABLE City

## MySQL存储引擎

存储引擎是数据库管理系统读写更新数据库中数据的软件模型。

MySQL支持的存储引擎有：

- MyISAM，早于5.5版本的默认引擎
- InnoDB
- Memory
- CSV
- 等等

情况很复杂，选择之前最好上[StackOverFlow](http://stackoverflow.com/)问问。

创建表时使用`ENGINE`关键字指定引擎：

    mysql> CREATE TABLE Cars(Id INTEGER PRIMARY KEY, Name VARCHAR(50), 
        -> Cost INTEGER) ENGINE='MyISAM';

查看当前引擎：

    mysql> SHOW VARIABLES LIKE 'storage_engine';

发现特定数据库的表引擎

    mysql> SELECT ENGINE FROM information_schema.TABLES
        -> WHERE TABLE_SCHEMA='mydb'
        -> AND TABLE_NAME='Cars';

更改表的引擎：

    mysql> ALTER TABLE Cars ENGINE='InnoDB';

## MySQL数据类型

### 数值

整数：

|Data type 	|Bytes 	|Minimum value 	            |Maximum value      |
|-----------|-------|---------------------------|-------------------|
|TINYINT 	|1      |-128 	                    |127                |
|SMALLINT 	|2      |-32768 	                |32767              |
|MEDIUMINT 	|3      |-8388608 	                |8388607            |
|INTEGER 	|4      |-2147483648                |2147483647         |
|BIGINT 	|8      |-9223372036854775808 	    |9223372036854775807|


浮点：

|Data type 	|Bytes 	|
|-----------|-------|
|FLOAT      |4      |
|DOUBLE     |8      |
|DECIML     |(M位，小数点后D位)|


定义表时指定：

    mysql> CREATE TABLE Numbers (Id TINYINT, Floats FLOAT, Decimals DECIMAL(3, 2));

更改列字段内型：

    mysql> ALTER TABLE Ages MODIFY Age TINYINT UNSIGNED;

插入值

    mysql> INSERT INTO Numbers VALUES (1, 1.1, 1.1), (2, 1.1, 1.1), (3, 1.1, 1.1);

DECIMAL类型更加精确，FLOAT和DOUBLE都只是近似。

### 日期和时间

有这么几种：

|Data type 	|范围 	                            |显示格式   |
|-----------|-----------------------------------|-----------|
|DATE       |  '1000-01-01' 到 '9999-12-31'.    |YYYY-MM-DD |
|TIME       |  '-838:59:59' to '838:59:59'.     |HH:MM:SS   |
|DATETIME   | '1000-01-01 00:00:00' to '9999-12-31 23:59:59'.|YYYY-MM-DD HH:MM:SS|
|YEAR       | 1901 to 2155 | YYYY |
|TIMESTAMP  | '1970-01-01 00:00:01' UTC to '2038-01-19 03:14:07' UTC |见下表|

|Data type      |Format         |
|---------------|---------------|
|TIMESTAMP(14)  |YYYYMMDDHHMMSS |
|TIMESTAMP(12)  |YYMMDDHHMMSS   |
|TIMESTAMP(10)  |YYMMDDHHMM     |
|TIMESTAMP(8)   |YYYYMMDD       |
|TIMESTAMP(6)   |YYMMDD         |
|TIMESTAMP(4)   |YYMM           |
|TIMESTAMP(2)   |YY             |
 
DATE、DATETIME和DATE输入时可支持多种格式，分隔符可以任意，超出范围截断到0.

    mysql> CREATE TABLE Dates(Id TINYINT, Dates DATE);
    mysql> INSERT INTO Dates VALUES(1, '2011-01-24');
    mysql> INSERT INTO Dates VALUES(2, '2011/01/25');
    mysql> INSERT INTO Dates VALUES(3, '20110126');
    mysql> INSERT INTO Dates VALUES(4, '110127');
    mysql> INSERT INTO Dates VALUES(5, '2011+01+28');

`TIMEDIFF`计算时差：

    mysql> SELECT TIMEDIFF('23:34:32', '22:00:00');

`TIME`函数提取时间部分

    mysql> SELECT TIME('2011-01-29 11:27:42');

`DAYNAME`函数提取星期名。

    mysql> SELECT DAYNAME('2011@01@29 11@50@13');

MySQL自动填充TIMESTAMP列，记录`INSERT`和`UPDATE`时间。

### 字符串

|Data type      |Format                 |备注                |
|---------------|-----------------------|--------------------|
|CHAR           |CHAR(x),x=0:255        |定长字符串存储      |
|VARCHAR        |VARCHAR(x),x=0:65535   |变长字符串数据存储  |
|BINARY         |BINARY(x),x=0:255      |定长字节存储        |
|VARBINARY      |VARBINARY(x),x=0:65535 |变长字节存储        |
|TINYBLOB       |0-255                  |BLOB存储大二进制对象|
|BLOB           |0-65535                |                    |
|MEDIUMBLOB     |0 - 16777215           |                    |
|LONGBLOB       |0 - 4294967295         |                    |
|TINYTEXT       |0-255                  |TEXT存储大文本数据  |
|TEXT           |0-65535                |                    |
|MEDIUMTEXT     |0 - 16777215           |                    |
|LONGTEXT       |0 - 4294967295         |                    |

`ENUM`创建一个只能插入列表中特定值的表

    mysql> CREATE TABLE SizeTable(Size ENUM('S', 'M', 'L', 'XL', 'XXL'));

`SET`类似于`ENUM`，但可以包含0个或多个列表中的值。

## 创建、更改和删除表

### 创建指令

创建一个表，指定表名、列的名称和类型：

    mysql> CREATE TABLE Testing(Id INTEGER);

查看某个表的建表语句

    mysql> SHOW CREATE TABLE Testing;

创建的，非临时表可以通过`SHOW TABLES`语法查看：

    mysql> SHOW TABLES LIKE 'T%';

## 删除表

删除表：

    mysql> DROP TABLE Testing;

## 更改表

使用`ALTER TABLE`语法更改表。以下为重命名表、添加列、添加主键、更改列、删除列操作。(DESCRIBE和SHOW COLUMNS FROM同义，INTEGER和INT相同)

    mysql> ALTER TABLE Testing RENAME TO TestTable;
    mysql> ALTER TABLE TestTable ADD iValues INT;
    mysql> ALTER TABLE TestTable ADD PRIMARY KEY (Id);
    mysql> ALTER TABLE TestTable CHANGE COLUMN iValues iValues1 INT;
    mysql> ALTER TABLE TestTable DROP COLUMN iValues1;

## MySQL表达式

### 字面常量

    mysql> SELECT 3, 'Wolf', 34.5, 0x34, 0+b'10111';
    mysql> SELECT NULL, \N;
    mysql> SELECT TRUE, FALSE;
    mysql> SELECT '2011-01-11', '23:33:01', '98/11/31/ 14:22:20';

### 变量

    mysql> SET @name = 'Jane';
    mysql> SELECT @name;

### 运算符

包括一元的

    mysql> SELECT NOT (3>9);

算术的：

    mysql> SELECT 9/2, 9 DIV 2;

逻辑的：

    mysql> SELECT FALSE XOR FALSE, FALSE XOR TRUE,
    -> TRUE XOR FALSE, TRUE XOR TRUE;

关系的：

    mysql> SELECT 3 * 3 = 9, 9 = 9, 3 < 4, 3 <> 5, 4 <= 4, 5 != 5;

位的：

    mysql> SELECT 6 | 3, 6 & 3, 6 << 1;

其它：

    mysql> SET @running = FALSE;
    mysql> SELECT @running IS FALSE;
    mysql> SELECT 'Tom' IN ('Tom', 'Frank', 'Jane');
    mysql> SELECT * FROM Cars Where Name IN ('Audi', 'Hummer');
    mysql> SELECT * FROM Cars WHERE Name LIKE 'Vol%';
    mysql> SELECT * FROM Cars WHERE Name LIKE '____';
    mysql> SELECT * FROM Cars WHERE Name REGEXP 'e.$';
    mysql> SELECT * FROM Cars WHERE Name REGEXP '^.e.*e.$';
    mysql> SELECT * FROM Cars WHERE Cost BETWEEN 20000 AND 55000;

### 优先级

加个括号吧

同级运算符从左到右执行

## 插入、更新和删除数据

## 插入

插入时可以指定插入的列，也可以不指定

    mysql> INSERT INTO Books(Id, Title, Author) VALUES(1, 'War and Peace', 
    -> 'Leo Tolstoy');
    mysql> INSERT INTO Books VALUES(3, 'Crime and Punishment',
    -> 'Fyodor Dostoyevsky');

若不指定`Id`也可。

    mysql> INSERT INTO Books(Title, Author) VALUES ('The Brothers Karamazov',
    -> 'Fyodor Dostoyevsky');

一次可以插入单个或多个值

    mysql> INSERT INTO Books(Title, Author) VALUES ('The Insulted and Humiliated',
    -> 'Fyodor Dostoyevsky'), ('Cousin Bette', 'Honore de Balzac');

`REPLACE`可以取代特定行：

    mysql> REPLACE INTO Books VALUES(3, 'Paradise Lost', 'John Milton');

插入也可以和`SELECT`结合：

    mysql> INSERT INTO Books2 SELECT * FROM Books;

可以使用`LOAD DATA INFILE`和`LOAD XML INFILE`语法从文件插入：

    mysql> LOAD DATA INFILE '/tmp/books.csv'    
        -> INTO TABLE Books    
        -> FIELDS TERMINATED BY ','    
        -> LINES TERMINATED BY '\n';

    mysql> LOAD XML INFILE '/home/vronskij/programming/mysql/books.xml' INTO TABLE Books;

### 删除

从表中删除：

    mysql> DELETE FROM Books2 WHERE Id=1;
    mysql> DELETE FROM Books2;
    mysql> TRUNCATE Books2;

### 更新

`UPDATE`用于变更选中行的列值。

mysql> UPDATE Books SET Author='Lev Nikolayevich Tolstoy'
    -> WHERE Id=1;

## SELECT语句

### 获取数据

选择所有内容

    mysql> SELECT * FROM Cars;

选择特定的列

    mysql> SELECT Name, Cost FROM Cars;

可以重命名列名：

    mysql> SELECT Name, Cost AS Price FROM Cars;

限制输出个数：

    mysql> SELECT * FROM Cars LIMIT 4;
    mysql> SELECT * FROM Cars LIMIT 2, 4;
    mysql> SELECT * FROM Cars LIMIT 4 OFFSET 2;  # 同上

### 排序数据

以降序(`DESC`)或升序(`ASC`)排序：

    mysql> SELECT Name, Cost FROM Cars ORDER BY Cost DESC;

### WHERE

WHERE语句就像个过滤器：

    mysql> SELECT * FROM Orders WHERE Customer="Smith";
    mysql> SELECT * FROM Orders WHERE Customer LIKE "B%";

### 移除重复项

`DISTINCT`从结果中选择唯一的结果集。

    mysql> SELECT DISTINCT Customer FROM Orders WHERE Customer LIKE 'B%';

`COUNT`函数统计个数

    mysql> SELECT COUNT(Customer) AS "Orders by Brown" FROM Orders WHERE Customer="Brown";

## 聚合数据

`GROUP BY`语句被用来结合值一样的数据库记录到一个单一的记录中。通常和聚合函数一起使用。

    mysql> SELECT SUM(OrderPrice) AS Total, Customer FROM Orders GROUP BY Customer;

使用聚合函数时不能使用`WHERE`而是使用`HAVING`：

    mysql> SELECT SUM(OrderPrice) AS Total, Customer FROM Orders
        -> GROUP BY Customer HAVING SUM(OrderPrice)>1000;

### 选择内容到文件

`SELECT`语句能被用来写入表到文件中：

    mysql> SELECT * INTO OUTFILE '/tmp/cars.txt'
        -> FIELDS TERMINATED BY ','
        -> LINES TERMINATED BY '\n'
        -> FROM Cars;

## 子查询

又称嵌套查询，可以和`INSERT`、`SELECT`、`UPDATE`和`DELETE`配合使用：

    mysql> INSERT INTO Cars2 SELECT * FROM Cars;
    mysql> SELECT Name FROM Customers WHERE 
    -> CustomerId=(SELECT CustomerId FROM Reservations WHERE Id=5);
    mysql> SELECT Name FROM Customers WHERE CustomerId IN    
    -> (SELECT DISTINCT CustomerId FROM Reservations);
    mysql> SELECT Name FROM Cars WHERE Cost <
    -> (SELECT AVG(Cost) FROM Cars);

`EXISTS`和`NOT EXISTS`：

    mysql> SELECT Name FROM Customers WHERE EXISTS
    -> (SELECT * FROM Reservations WHERE
    -> Customers.CustomerId=Reservations.CustomerId);
    mysql> SELECT Name FROM Customers WHERE NOT EXISTS    
    -> (SELECT * FROM Reservations WHERE 
    -> Customers.CustomerId=Reservations.CustomerId);

## 限制

限制用来限定列的类型。

`NOT NULL`：

    mysql> CREATE TABLE People(Id INTEGER, LastName TEXT NOT NULL,
    ->                     FirstName TEXT NOT NULL, City VARCHAR(55));

`UNIQUE`：

    mysql> CREATE TABLE Brands(Id INTEGER, BrandName VARCHAR(30) UNIQUE);

`PRIMARY KEY`自动拥有`UNIQUE`和`NOT NULL`：

    mysql> CREATE TABLE Brands(Id INTEGER PRIMARY KEY, BrandName VARCHAR(30) UNIQUE);

`FOREIGN KEY`是指向另一个表主键的索引，用来联系两个表：

    mysql> CREATE TABLE Books(BookId INTEGER PRIMARY KEY, Title VARCHAR(50),
        -> AuthorId INTEGER, FOREIGN KEY(AuthorId) REFERENCES Authors(AuthorId))
        -> type=InnoDB;

`ENUM`可以是列出中的一个：

    mysql> CREATE TABLE Shops(Id INTEGER, Name VARCHAR(55), 
        -> Quality ENUM('High', 'Average', 'Low'));

`SET`可以是零个或多个：

    mysql> CREATE TABLE Students(Id INTEGER, Name VARCHAR(55), 
        -> Certificates SET('A1', 'A2', 'B1', 'C1')); 

注意插入时`Certificates`列的值用括号括起来，之间用逗号分隔且不能有空格。

    mysql> INSERT INTO Students VALUES(3, 'Mark', 'A1,A2,D1,D2');

## 导出和导入数据

简单导出到文件和导入到数据库：

    mysql> SELECT * FROM Cars INTO OUTFILE '/tmp/cars';  # 空格分隔
    mysql> LOAD DATA INFILE '/tmp/cars.csv' INTO TABLE Cars
    -> FIELDS TERMINATED BY ',';

导入到xml文件：

    $ mysql -uroot -p --xml -e 'SELECT * FROM mydb.Cars' > /tmp/cars.xml
    mysql> LOAD XML /tmp/cars.xml INTO TABLE Cars;

使用mysqldump工具：

只保存数据结构：

    $ mysqldump -u root -p --no-data mydb > bkp1.sql

只保存数据

    $ mysqldump -uroot -p --no-create-info mydb > bkp2.sql

完整数据库

    $ mysqldump -uroot -p mydb > bkp3.sql

恢复数据：

    mysql> CREATE DATABASE mydb;
    mysql> USE mydb;
    mysql> source bkp3.sql

## 连接表

### 内连接

分`INNER JOIN`、`NATURAL INNER JOIN`和`CROSS INNER JOIN`三种， `INNER`关键字可省略。以下是`INNER JOIN`

    mysql> SELECT Name, Day FROM Customers AS C JOIN Reservations 
        -> AS R ON C.CustomerId=R.CustomerId;
    mysql> SELECT Name, Day FROM Customers, Reservations
        -> WHERE Customers.CustomerId=Reservations.CustomerId;

`CROSS JOIN`是两个表的笛卡尔乘积。

    mysql> SELECT Name, Day FROM Customers CROSS JOIN Reservations;
    mysql> SELECT Name, Day FROM Customers, Reservations;

### 外连接

左内连，选取左边所有的值：

    mysql> SELECT Name, Day FROM Customers LEFT JOIN Reservations
        -> ON Customers.CustomerId=Reservations.CustomerId;
    mysql> SELECT Name, Day FROM Customers LEFT JOIN Reservations
        -> USING (CustomerId);

右内连，同上，孤单的右边值对应的左边为`NULL`

    mysql> SELECT Name, Day FROM Customers RIGHT JOIN
        -> Reservations USING (CustomerId);

自然连，会把所有列连在一起：

    mysql> SELECT Name, Day FROM Customers NATURAL JOIN Reservations;
    mysql> SELECT Name, Day FROM Customers 
        -> NATURAL LEFT JOIN Reservations;
    mysql> SELECT Name, Day FROM Customers
        -> NATURAL RIGHT JOIN Reservations;

## MySQL函数

### 数学函数

    mysql> SELECT RAND(), ABS(-3), PI(), SIN(0.5),
         > BIN(22), OCT(22), HEX(22)
         > CEIL(11.256), FLOOR(11.256), ROUND(11.256, 2),
         > POW(3, 3), SQRT(9),
         > DEGREES(2*PI());

### 聚合函数

    mysql> SELECT MIN(Cost), MAX(Cost), AVG(Cost)
        -> FROM Cars;
    mysql> SELECT SUM(Cost), COUNT(Id), STD(Cost), 
        -> VARIANCE(Cost) FROM Cars;

### 字符串函数

    mysql> SELECT LENGTH('ZetCode'), UPPER('ZetCode'), LOWER('ZetCode');
    mysql> SELECT LPAD(RPAD("ZetCode", 10, "*"), 13, "*");
    mysql> SELECT REVERSE('ZetCode'), REPEAT('*', 6);
    mysql> SELECT LEFT('ZetCode', 3), RIGHT('ZetCode', 3), 
        -> SUBSTRING('ZetCode', 3, 3);
    mysql> SELECT STRCMP('byte', 'byte'), CONCAT('three', ' apples');
    mysql> SELECT REPLACE('basketball', 'basket', 'foot');

### 日期时间函数

    mysql> SELECT DAYNAME('2011-01-23'), YEAR('2011/01/23'),
        -> MONTHNAME('110123');
    mysql> SELECT NOW();
    mysql> SELECT CURTIME(), CURDATE();
    mysql> SELECT DATEDIFF('2011-3-12', '2011-1-12');
    mysql> SELECT WEEKOFYEAR('110123'), WEEKDAY('110123'),
        -> QUARTER('110123');
    mysql> SELECT DATE_FORMAT('110123', '%d-%m-%Y');
    mysql> SELECT DATE_ADD('110123', INTERVAL 45 DAY), 
        -> SUBDATE('110309', INTERVAL 45 DAY);

### 系统函数

    mysql> SELECT VERSION(), DATABASE();
    mysql> SELECT USER();
    mysql> SELECT CHARSET('ZetCode'), COLLATION('ZetCode');

## MySQL视图

视图是一种从表中切取的特殊伪表。有以下限制：

- `SELECT`不能包含子查询
- `SELECT`语句不能指向系统或用户变量
- 在定义中指向的任何表或视图必须存在
- 不能创建临时视图
- 一个视图不能被触发关联。

创建、更改和删除视图：

    mysql> CREATE VIEW CheapCars AS 
        -> SELECT Name FROM Cars WHERE Cost<25000;
    mysql> ALTER VIEW CheapCars AS SELECT Name FROM Cars
        -> WHERE Cost<30000;
    mysql> DROP VIEW CheapCars;

找到视图：

    mysql> SHOW FULL TABLES;
    mysql> SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES;
    mysql> SELECT TABLE_NAME FROM information_schema.VIEWS;

`UNION`被用来结合两个或更多`SELECT`语句得到的结果集，可以通过`UNION`创建视图

    mysql> CREATE VIEW FavoriteCars AS
        -> SELECT * FROM Cars WHERE Id=7
        -> UNION SELECT * FROM Cars WHERE Id=4
        -> UNION SELECT * FROM Cars WHERE Id=5;

## 事务

数据库并发操作控制单位。这些操作可以commit可以回滚。

解释下ACID。

### 隔离级

- 序列，一个接一个
- 重复读，读的时候其它事务没提交就没法修改，改的时候没提交其它事务就没法读，默认级别。
- 读提交。
- 读未提交。

1. 脏读(事务没提交，提前读取)：脏读就是指当一个事务正在访问数据，并且对数据进行了修改，而这种修改还没有提交到数据库中，这时，另外一个事务也访问这个数据，然后使用了这个数据。 
2. 不可重复读(两次读的不一致) ：是指在一个事务内，多次读同一数据。在这个事务还没有结束时，另外一个事务也访问该同一数据。那么，在第一个事务中的两次读数据之间，由于第二个事务的修改，那么第一个事务两次读到的的数据可能是不一样的。这样就发生了在一个事务内两次读到的数据是不一样的，因此称为是不可重复读。例如，一个编辑人员两次读取同一文档，但在两次读取之间，作者重写了该文档。当编辑人员第二次读取文档时，文档已更改。原始读取不可重复。如果只有在作者全部完成编写后编辑人员才可以读取文档，则可以避免该问。
3. 幻读 : 是指当事务不是独立执行时发生的一种现象，例如第一个事务对一个表中的数据进行了修改，这种修改涉及到表中的全部数据行。同时，第二个事务也修改这个表中的数据，这种修改是向表中插入一行新数据。那么，以后就会发生操作第一个事务的用户发现表中还有没有修改的数据行，就好象发生了幻觉一样。例如，一个编辑人员更改作者提交的文档，但当生产部门将其更改内容合并到该文档的主复本时，发现作者已将未编辑的新材料添加到该文档中。如果在编辑人员和生产部门完成对原始文档的处理之前，任何人都不能将新材料添加到文档中，则可以避免该问题。 

默认隔离级和可能出现情况：

|隔离级别           |Phantom read |Nonrepeatable read |Dirty read   |
|-------------------|-------------|-------------------|-------------|
|序列化             |不可能       |不可能             |不可能       |
|可重读             |可能         |不可能             |不可能       |
|读提交             |可能         |可能               |不可能       |
|读未提交           |可能         |可能               |可能         |

查看和选择隔离级别

    mysql> SELECT @@tx_isolation;
    mysql> SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

### 自动提交

MySQL会自动提交不以`START`开头的`UPDATE`和`INSERT`语句。查看和设置当前设置：

    mysql> SELECT @@autocommit;
    mysql> SET autocommit=0;

提交后的状态无法回滚。`ROLLBACK`

### 开始事务

自动提交的命令会被MySQL封装为一个单独的事务。我们也可以用`START`语句实现。

    mysql> START TRANSACTION;

之后可以执行命令提交或者回滚：

提交

    mysql> INSERT INTO Test VALUES (5), (6);
    mysql> INSERT INTO Test VALUES (7), (8);
    mysql> COMMIT;

回滚

    mysql> INSERT INTO Test VALUES (5), (6);
    mysql> INSERT INTO Test VALUES (7), (8);
    mysql> ROLLBACK;

## 在MySQL中存储例程

在MySQL中存在两种存储例程，一种是过程，一种是函数。

过程用`CALL`调用，不返回值。函数通过`SELECT`使用，返回值。

过程存储有利有弊。

### 一个简单过程

创建`AllCars`g过程选取`Cars`表中所有内容：

    mysql> CREATE PROCEDURE AllCars() SELECT * FROM Cars;
    mysql> CALL AllCars();

### 一个简单函数

定义过程和函数最好的方法是一个单独的sql文件。以下是创建了一个`sql`文件。通过`CREATE FUNCTION`创建函数，通过`SELECT`语句调用。

    -- this function computes the area
    -- of a circle; it takes a radius as
    -- a parameter
    
    DELIMITER $$
    
    DROP FUNCTION IF EXISTS CircleArea;
    
    CREATE FUNCTION CircleArea(r DOUBLE) RETURNS DOUBLE
    BEGIN
        DECLARE area DOUBLE;
    
        SET area = r * r * pi();
        RETURN area;
    END 
    
    $$
    
    DELIMITER ;

函数调用：

    mysql> source circlearea.sql
    mysql> SELECT CircleArea(5.5);

### 过程参数

有三种参数内型：

- IN，传递给过程，只能在函数内修改
- OUT，输出参数，并不从外部传递给过程
- INOUT，混合内型，可以传递给过程来更改也可以在过程外部存取。

在sql文件中定义过程：

    -- this procedure computes the power 
    -- of a given value
    
    DELIMITER $$
    
    DROP PROCEDURE IF EXISTS Pow;
    
    CREATE PROCEDURE Pow(IN val DOUBLE, OUT p DOUBLE) 
    BEGIN
        SET p = val * val;
    END 
    
    $$
    
    DELIMITER ;

调用：

    mysql> source power.sql
    
    mysql> CALL Pow(3, @p);
    
    mysql> SELECT @p;

### 找到过程或函数

通过`SHOW PROCEDURE STATUS`和`SHOW FUNCTION STATUS`查看。

或者

    mysql> SELECT SPECIFIC_NAME from information_schema.ROUTINES  
        -> WHERE ROUTINE_TYPE='PROCEDURE';
    mysql> SELECT SPECIFIC_NAME from information_schema.ROUTINES 
        -> WHERE ROUTINE_TYPE='FUNCTION';

## MySQL C API

MySQL有个C API

debian上要装这个：

    $ sudo apt-get install libmysqlclient-dev

我们只要在头文件中包含`mysql.h`，编译时以以下方式编译：

    $ gcc version.c -o version  `mysql_config --cflags --libs`

基本步骤是先初始化连接：

    MYSQL *con = mysql_init(NULL);

    if (con == NULL) 
    {
        fprintf(stderr, "%s\n", mysql_error(con));
        exit(1);
    }

再真的连到服务器或某个数据库中：

    if (mysql_real_connect(con, "localhost", "root", "root_pswd", 
            NULL, 0, NULL, 0) == NULL) 
    {
        fprintf(stderr, "%s\n", mysql_error(con));
        mysql_close(con);
        exit(1);
    }

执行操作：

    if (mysql_query(con, "CREATE DATABASE testdb")) 
    {
        fprintf(stderr, "%s\n", mysql_error(con));
        mysql_close(con);
        exit(1);
    }

取回数据：

    MYSQL_RES *result = mysql_store_result(con);
    
    if (result == NULL) 
    {
        finish_with_error(con);
    }
    
    int num_fields = mysql_num_fields(result);
    
    MYSQL_ROW row;
    
    while ((row = mysql_fetch_row(result))) 
    { 
        for(int i = 0; i < num_fields; i++) 
        { 
            printf("%s ", row[i] ? row[i] : "NULL"); 
        } 
            printf("\n"); 
    }
    
    mysql_free_result(result);

还有些其它函数，参考[http://dev.mysql.com/doc/refman/5.1/zh/apis.html](http://dev.mysql.com/doc/refman/5.1/zh/apis.html)


