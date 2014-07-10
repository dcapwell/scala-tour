# Trees
When you get deeper into macros, you will find yourself working with the `Tree` instances directly (quasiquotes are some times not as easy to use).  When this happens, you will need to know which instances to use.

This section really just outputs whats in [Scala's Trees.scala](https://github.com/scala/scala/blob/2.11.x/src/reflect/scala/reflect/api/Trees.scala#L308).  Main reason for this is that I find this doc faster to look things up than in intellij (the whole trait within trait within trait that defines a trait thing... intellij has a harder time searching this).

If you prefer ScalaDocs, you can look at them [here](http://www.scala-lang.org/files/archive/nightly/docs/library/index.html#scala.reflect.api.Trees).  Again, I find those docs to have way too much noise.

## Modifiers
Thie type doesn't really map to normal scala code, but many things have modifiers.

```scala
lazy val foo: String
```

In this example, foo has modifiers, namely lazy (which is really a flag).

To create
```scala
Modifiers(flags: FlagSet, privateWithin: Name, annotations: List[Tree])
```

To get values

```scala
def flags: FlagSet
def hasFlag(flag: FlagSet): Boolean
def privateWithin: Name
def annotations: List[Tree]
def mapAnnotations(f: List[Tree] => List[Tree]): Modifiers
```

## FlagSet
A FlagSet is a single instance or a set of instances of flags.  So what are flags?

```scala
/** Flag indicating that tree represents a trait */
val TRAIT: FlagSet

/** Flag indicating that a tree is an interface (i.e. a trait which defines only abstract methods) */
val INTERFACE: FlagSet

/** Flag indicating that tree represents a mutable variable */
val MUTABLE: FlagSet

/** Flag indicating that tree represents a macro definition. */
val MACRO: FlagSet

/** Flag indicating that tree represents an abstract type, method, or value */
val DEFERRED: FlagSet

/** Flag indicating that tree represents an abstract class */
val ABSTRACT: FlagSet

/** Flag indicating that tree has `final` modifier set */
val FINAL: FlagSet

/** Flag indicating that tree has `sealed` modifier set */
val SEALED: FlagSet

/** Flag indicating that tree has `implicit` modifier set */
val IMPLICIT: FlagSet

/** Flag indicating that tree has `lazy` modifier set */
val LAZY: FlagSet

/** Flag indicating that tree has `override` modifier set */
val OVERRIDE: FlagSet

/** Flag indicating that tree has `private` modifier set */
val PRIVATE: FlagSet

/** Flag indicating that tree has `protected` modifier set */
val PROTECTED: FlagSet

/** Flag indicating that tree represents a member local to current class,
*  i.e. private[this] or protected[this].
*  This requires having either PRIVATE or PROTECTED set as well.
*/
val LOCAL: FlagSet

/** Flag indicating that tree has `case` modifier set */
val CASE: FlagSet

/** Flag indicating that tree has `abstract` and `override` modifiers set */
val ABSOVERRIDE: FlagSet

/** Flag indicating that tree represents a by-name parameter */
val BYNAMEPARAM: FlagSet

/** Flag indicating that tree represents a class or parameter.
*  Both type and value parameters carry the flag. */
val PARAM: FlagSet

/** Flag indicating that tree represents a covariant
*  type parameter (marked with `+`). */
val COVARIANT: FlagSet

/** Flag indicating that tree represents a contravariant
*  type parameter (marked with `-`). */
val CONTRAVARIANT: FlagSet

/** Flag indicating that tree represents a parameter that has a default value */
val DEFAULTPARAM: FlagSet

/** Flag indicating that tree represents an early definition */
val PRESUPER: FlagSet

/** Flag indicating that tree represents a variable or a member initialized to the default value */
val DEFAULTINIT: FlagSet

/** Flag indicating that tree represents an enum.
*
*  It can only appear at
*  - the enum's class
*  - enum constants
**/
val ENUM: FlagSet

/** Flag indicating that tree represents a parameter of the primary constructor of some class
*  or a synthetic member underlying thereof. E.g. here's how 'class C(val x: Int)' is represented:
*
*      [[syntax trees at end of parser]]// Scala source: tmposDU52
*      class C extends scala.AnyRef {
*        <paramaccessor> val x: Int = _;
*        def <init>(x: Int) = {
*          super.<init>();
*          ()
*        }
*      }
*      ClassDef(
*        Modifiers(), TypeName("C"), List(),
*        Template(
*          List(Select(Ident(scala), TypeName("AnyRef"))),
*          noSelfType,
*          List(
*            ValDef(Modifiers(PARAMACCESSOR), TermName("x"), Ident(TypeName("Int")), EmptyTree),
*            DefDef(
*              Modifiers(), nme.CONSTRUCTOR, List(),
*              List(List(ValDef(Modifiers(PARAM | PARAMACCESSOR), TermName("x"), Ident(TypeName("Int")), EmptyTree))), TypeTree(),
*              Block(List(pendingSuperCall), Literal(Constant(())))))))))
*/
val PARAMACCESSOR: FlagSet

/** Flag indicating that tree represents a parameter of the primary constructor of some case class
*  or a synthetic member underlying thereof.  E.g. here's how 'case class C(val x: Int)' is represented:
*
*      [[syntax trees at end of parser]]// Scala source: tmpnHkJ3y
*      case class C extends scala.Product with scala.Serializable {
*        <caseaccessor> <paramaccessor> val x: Int = _;
*        def <init>(x: Int) = {
*          super.<init>();
*          ()
*        }
*      }
*      ClassDef(
*        Modifiers(CASE), TypeName("C"), List(),
*        Template(
*          List(Select(Ident(scala), TypeName("Product")), Select(Ident(scala), TypeName("Serializable"))),
*          noSelfType,
*          List(
*            ValDef(Modifiers(CASEACCESSOR | PARAMACCESSOR), TermName("x"), Ident(TypeName("Int")), EmptyTree),
*            DefDef(
*              Modifiers(), nme.CONSTRUCTOR, List(),
*              List(List(ValDef(Modifiers(PARAM | PARAMACCESSOR), TermName("x"), Ident(TypeName("Int")), EmptyTree))), TypeTree(),
*              Block(List(pendingSuperCall), Literal(Constant(())))))))))
*/
val CASEACCESSOR: FlagSet

/** Flag used to distinguish programmatically generated definitions from user-written ones.
*  @see ARTIFACT
*/
val SYNTHETIC: FlagSet

/** Flag used to distinguish platform-specific implementation details.
*  Trees and symbols which are currently marked ARTIFACT by scalac:
*    * $outer fields and accessors
*    * super accessors
*    * protected accessors
*    * lazy local accessors
*    * bridge methods
*    * default argument getters
*    * evaluation-order preserving locals for right-associative and out-of-order named arguments
*    * catch-expression storing vals
*    * anything else which feels a setFlag(ARTIFACT)
*
*  @see SYNTHETIC
*/
val ARTIFACT: FlagSet

/** Flag that indicates methods that are supposed to be stable
*  (e.g. synthetic getters of valdefs).
*/
val STABLE: FlagSet

/** The empty set of flags
*  @group Flags
*/
val NoFlags: FlagSet
```

## ValDef
Maps to `val foo = ...`.  It contains the type of variable (val, var), name, type, and rhs (right-hand-side, aka expression).

To create

```scala
ValDef(mods: Modifiers, name: TermName, tpt: Tree, rhs: Tree)
```

To read

```scala
def mods: Modifiers
def name: TermName
def tpt: Tree
def rhs: Tree
```

## ClassDef
This type maps to `... class Foo() extends ...`.

To create an instance, you need to call
```scala
ClassDef(mods: Modifiers, name: TypeName, tparams: List[TypeDef], impl: Template)
```

To get the values out of a class

```scala
def mods: Modifiers
def name: TypeName
def tparams: List[TypeDef]
def impl: Template
```

## PackageDef
## ModuleDef
## DefDef
## TypeDef
## LabelDef
## Import
## Template
## Block
## CaseDef
## Alternative
## Star
## Bind
## UnApply
## Function
## Assign
## AssignOrNamedArg
## If
## Match
## Return
## Try
## Throw
## New
## Typed
## TypeApply
## Apply
## Super
## This
## Select
## Ident
## RefTree
## ReferenceToBoxed
## Literal
## TypeTree
## Annotated
## SingletonTypeTree
## SelectFromTypeTree
## CompoundTypeTree
## AppliedTypeTree
## TypeBoundsTree
## ExistentialTypeTree
