webpackJsonp([119,192],{503:function(n,e){n.exports={rawContent:'\n\n# 快速ebuild向导\n\n这页是个非常简洁的ebuild写作指南。它不包含许多开发者面临的细节和问题，而是给出足够用来理解ebuild如何工作的微小的例子。\n\n为了正确的涵盖所有来龙去脉，参见[Ebuild Writing](http://devmanual.gentoo.org/ebuild-writing/index.html)。[General Concepts](http://devmanual.gentoo.org/general-concepts/index.html)章节也很有用。\n\n注意这里的例子，虽然基于真实的ebuilds树，但有些部分大刀阔斧的修剪、更改和简化了。\n\n## 第一个Ebuild\n\n我们从Exuberant Ctags工具开始，一个代码索引工具。这时一个简化的`dev-util/ctags/ctags-5.5.4.ebuild`(你能在主目录下找到真实的ebuild)\n\n    # Copyright 1999-2012 Gentoo Foundation\n    # Distributed under the terms of the GNU General Public License v2\n    # $Header: $\n    \n    EAPI=4\n    \n    DESCRIPTION="Exuberant ctags generates tags files for quick source navigation"\n    HOMEPAGE="http://ctags.sourceforge.net"\n    SRC_URI="mirror://sourceforge/ctags/${P}.tar.gz"\n    \n    LICENSE="GPL-2"\n    SLOT="0"\n    KEYWORDS="~mips ~sparc ~x86"\n    \n    src_configure() {\n        econf --with-posix-regex\n    }\n    \n    src_install() {\n        emake DESTDIR="${D}" install\n    \n        dodoc FAQ NEWS README\n        dohtml EXTENDING.html ctags.html\n    }\n\n### 基本格式\n\n如你所见，ebuilds仅仅是在特殊环境中执行的`bash`脚本。\n\n在ebuild的顶部是头块(header block)，出现在所有ebuild中。\n\nEbuild使用tabs缩进，每个tab代表四格空格。参见[Ebuild File Format](http://devmanual.gentoo.org/ebuild-writing/file-format/index.html).\n\n### 信息变量\n\n接着，有一系列变量将告诉Portage有关包和ebuild的各种东西。\n\nebuild的`EAPI`，参见[EAPI Usage and Description](http://devmanual.gentoo.org/ebuild-writing/eapi/index.html)\n\n`DESCRIPTION`变量是包及包的作用的简短描述。\n\n`HOMEPAGE`是链接到包的主页的链接。(切记包含`http://`部分)。\n\n`SRC_URI`告诉Portage用来下载源码包的地址。这里，`mirror://sourceforge/`是意为“任何Sourceforge镜像”的特殊标记。`${P}`是由Portage设置的只读变量，即包名和版本——示例中是`ctags-5.5.4`。\n\n`LICENSE`是协议`GPL-2`(GNU General Public License version 2)。\n\n`SLOT`告诉Portage这个包安装到哪个slot。\n\n`KEYWORDS`变量设置ebuild测试的架构。我们使用`～`keyword给我们新写的ebuild，包不允许被直接推送到稳定版，即使他们似乎工作。参见[Keywording](http://devmanual.gentoo.org/keywording/index.html)查看细节。\n\n### 构建函数\n\n接着一个叫`src_configure`的函数，Portage将在配置(_configure_)包时调用它。`econf`是执行`./configure`的一个封装。如果由于某些原因在`econf`时出错，Portage将停止而非继续安装。\n\n当Portage准备安装包时会调用`src_install`函数。这里有点微妙——并非直接安装到文件系统，我们必须安装到一个Portage通过`${D}`变量给出的特殊位置(Portage设置这个——参见[Install Destinations](http://devmanual.gentoo.org/general-concepts/install-destinations/index.html)和[Sandbox](http://devmanual.gentoo.org/general-concepts/sandbox/index.html))\n\n**注意：常规安装方法是`emake DESTDIR="${D}" install`，这适合所有符合标准的`Makefile`。如果给出sandbox错误，尝试用`einstall`代替。如果仍然失败，参看[src_install](http://devmanual.gentoo.org/ebuild-writing/functions/src_install/index.html)如何手工安装。**\n\n`dodoc`和`dohtml`部分是安装文件到相应的`/usr/share/doc`部分的辅助函数。\n\nebuild可以定义其它函数(参见[Ebuild Functions](http://devmanual.gentoo.org/ebuild-writing/functions/index.html))。在大多情况下，Portage提供合理的默认实现，通常做正确的事情，不需要定义`src_unpack`和`src_compile`函数。例如，`src_unpack`函数被用来解包或给源码打补丁，但是这个例子中默认实现做了我们所需要的所有事情。同样默认的`src_compile`函数将调用`emake`——一个`make`的封装。\n\n**注意：先前`|| die`结构不得不添加到每个命令后去检查错误。这在EAPI 4中不在必要——如果什么出错的话Portage提供的函数将自己die。**\n\n## 含依赖的ebuild\n\n在ctags的例子中，我们没告诉Portage有关任何依赖。当情况是这样时，没关系，因为ctags仅仅需要一个基本的工具链来编译和运行(参见[Implicit System Dependency](http://devmanual.gentoo.org/general-concepts/dependencies/index.html#implicit-system-dependency)理解为何我们不需要显式依赖)。然而事情很少这么简单。\n\n这是`app-misc/detox/detox-1.1.1.ebuild`：\n\n    # Copyright 1999-2012 Gentoo Foundation\n    # Distributed under the terms of the GNU General Public License v2\n    # $Header: $\n    \n    EAPI=4\n    \n    DESCRIPTION="detox safely removes spaces and strange characters from filenames"\n    HOMEPAGE="http://detox.sourceforge.net/"\n    SRC_URI="mirror://sourceforge/${PN}/${P}.tar.bz2"\n    \n    LICENSE="BSD"\n    SLOT="0"\n    KEYWORDS="~hppa ~mips sparc x86"\n    \n    RDEPEND="dev-libs/popt"\n    DEPEND="${RDEPEND}\n        sys-devel/flex\n        sys-devel/bison"\n    \n    src_configure() {\n        econf --with-popt\n    }\n    \n    src_install() {\n        emake DESTDIR="${D}" install\n        dodoc README CHANGES\n    }\n\n你再次看到ebuild头和不通的信息变量。在`SRC_URI`中，`${PN}`用来获取不含尾部版本的包名(还有更多的这种变量——参见[Predefined Read-Only Variables](http://devmanual.gentoo.org/ebuild-writing/variables/index.html#predefined-read-only-variables))。\n\n我们再次定义了`src_configure`和`src_install`函数。\n\nPortage依靠`DEPEND`和`RDEPEND`变量决定构建和运行包需要哪些变量。`DEPEND`变量列出编译时依赖，`RDEPEND`变量列出运行时依赖。参见[Dependencies](http://devmanual.gentoo.org/general-concepts/dependencies/index.html)获取更复杂的例子。\n\n## 带补丁的ebuild\n\n我们经常要打补丁。这通过`epatch`辅助函数在`src_prepare`函数中完成。为了使用`epatch`，必须告诉Portage需要的`eutils`eclass(eclass就像库一样)——这通过在ebuild顶部的`inherit eutils`完成。这是`app-misc/detoxdetox-1.1.0.ebuild`：\n\n    # Copyright 1999-2012 Gentoo Foundation\n    # Distributed under the terms of the GNU General Public License v2\n    # $Header: $\n    \n    EAPI=4\n    \n    inherit eutils\n    \n    DESCRIPTION="detox safely removes spaces and strange characters from filenames"\n    HOMEPAGE="http://detox.sourceforge.net/"\n    SRC_URI="mirror://sourceforge/${PN}/${P}.tar.bz2"\n    \n    LICENSE="BSD"\n    SLOT="0"\n    KEYWORDS="~hppa ~mips ~sparc ~x86"\n    \n    RDEPEND="dev-libs/popt"\n    DEPEND="${RDEPEND}\n        sys-devel/flex\n        sys-devel/bison"\n    \n    src_prepare() {\n        epatch "${FILESDIR}"/${P}-destdir.patch \\\n            "${FILESDIR}"/${P}-parallel_build.patch\n    }\n    \n    src_configure() {\n        econf --with-popt\n    }\n    \n    src_install() {\n        emake DESTDIR="${D}" install\n        dodoc README CHANGES\n    }\n\n注意`${FILESDIR}/${P}-destdir.patch`指向`detox-1.1.0-destdir.patch`，这个文件在Portage树的`files/`子文件夹中。更大的补丁文件必须在你的开发者空间`dev.gentoo.org`而不是`files/`或镜像中——参见[Gentoo Mirrors](http://devmanual.gentoo.org/general-concepts/mirrors/index.html#gentoo-mirrors)和[Patching with epatch](http://devmanual.gentoo.org/ebuild-writing/functions/src_prepare/epatch/index.html)。\n\n## 带USE标记的ebuild\n\n对`USE`标记，这里有个例子`dev-libs/libiconv/libiconv-1.9.2.ebuild`，一个`libc`实现的iconv替代。\n\n    # Copyright 1999-2012 Gentoo Foundation\n    # Distributed under the terms of the GNU General Public License v2\n    # $Header: $\n    \n    EAPI=4\n    \n    DESCRIPTION="GNU charset conversion library for libc which doesn\'t implement it"\n    HOMEPAGE="http://www.gnu.org/software/libiconv/"\n    SRC_URI="ftp://ftp.gnu.org/pub/gnu/libiconv/${P}.tar.gz"\n    \n    LICENSE="LGPL-2.1"\n    SLOT="0"\n    KEYWORDS="~amd64 ~ppc ~sparc ~x86"\n    IUSE="nls"\n    \n    DEPEND="!sys-libs/glibc"\n    \n    src_configure() {\n        econf $(use_enable nls)\n    }\n    \n    src_install() {\n        emake DESTDIR="${D}" install\n    }\n\n注意`IUSE`变量。这列出了所有(非特殊)ebuild使用的use标记。除其它事项外，它还将被用作`emerge -pv`时输出。\n\n这个包的`./configure`脚本使用了常规的`--enable-nls`或`--disable-nls`参数。我们用`use_enable`工具函数依赖用户`USE`标记自动生成这个(参见[Query Function Reference](http://devmanual.gentoo.org/function-reference/query-functions/index.html))。\n\n另一个复杂的例子是`mail-client/sylpheed/sylpheed-1.0.4.ebuild`：\n\n    # Copyright 1999-2012 Gentoo Foundation\n    # Distributed under the terms of the GNU General Public License v2\n    # $Header: $\n    \n    EAPI=4\n    \n    inherit eutils\n    \n    DESCRIPTION="A lightweight email client and newsreader"\n    HOMEPAGE="http://sylpheed.good-day.net/"\n    SRC_URI="mirror://sourceforge/${PN}/${P}.tar.bz2"\n    \n    LICENSE="GPL-2"\n    SLOT="0"\n    KEYWORDS="alpha amd64 hppa ia64 ppc ppc64 sparc x86"\n    IUSE="crypt imlib ipv6 ldap nls pda ssl xface"\n    \n    RDEPEND="=x11-libs/gtk+-2*\n        crypt? ( >=app-crypt/gpgme-0.4.5 )\n        imlib? ( media-libs/imlib2 )\n        ldap? ( >=net-nds/openldap-2.0.11 )\n        pda? ( app-pda/jpilot )\n        ssl? ( dev-libs/openssl )\n        xface? ( >=media-libs/compface-1.4 )\n        app-misc/mime-types\n        x11-misc/shared-mime-info"\n    DEPEND="${RDEPEND}\n        dev-util/pkgconfig\n        nls? ( >=sys-devel/gettext-0.12.1 )"\n    \n    src_prepare() {\n        epatch "${FILESDIR}"/${PN}-namespace.diff \\\n            "${FILESDIR}"/${PN}-procmime.diff\n    }\n    \n    src_configure() {\n        econf \\\n            $(use_enable nls) \\\n            $(use_enable ssl) \\\n            $(use_enable crypt gpgme) \\\n            $(use_enable pda jpilot) \\\n            $(use_enable ldap) \\\n            $(use_enable ipv6) \\\n            $(use_enable imlib) \\\n            $(use_enable xface compface)\n    }\n    \n    src_install() {\n        emake DESTDIR="${D}" install\n    \n        doicon sylpheed.png\n        domenu sylpheed.desktop\n    \n        dodoc [A-Z][A-Z]* ChangeLog*\n    }\n\n注意可选依赖。有些`use_enable`行使用两个参数的版本——这在USE标记名不完全匹配`./configure`参数时非常有用。\n',metaData:{layout:"post",title:"Quickstart Ebuild Guide",excerpt:"其实吧，本来想给friture打包的，最后发现不会用这东西……快速Ebuild向导，翻译自http://devmanual.gentoo.org/quickstart/index.html",category:"linux",tags:["gentoo"],disqus:!0}}}});