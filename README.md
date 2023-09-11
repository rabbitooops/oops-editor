实现编辑器的方向：
1. 关于协同，op操作只不过有三种而已，很容易就可以把这三种操作转化为对本编辑器数据结构的更新，所以实现协同是没问题的。
2. 使用canvas替代dom是更优选项，这是因为采用dom方案时，渲染数据由浏览器持有，那么我们想获取视图的信息就会收到各种掣肘，选区的控制也异常复杂，且dom方案最多能实现由css支持的能力，无法实现高度定制化的渲染能力，如字的排列
3. 编辑器渲染最大的敌人是字的宽高获取，因为获取它的宽高非常耗费时间，不过可以通过缓存实现，其他的只不过是空间位置的计算，也就是left和top，递归文档树即可得计算出整个文档节点的空间信息，依次渲染即可，且因只需渲染屏幕内的内容，性能非常优异。
4. 除此之外，对原生事件转化为用户意图进而得出当前的原子操作也非常重要，可将事件原子化，将原子化的事件进行组合，映射到对应的意图动作即可。

## 性能表现

欢迎测试！其他开源编辑器的性能都太差了，所以只取这两个开源编辑器进行比较。

![avatar](./perf.png)
![avatar](./graph.png)
